// SPDX-License-Identifier: MIT
// Module: application::factory
// Version: v1.4.0
// Description: Factory contract for Schedule deployment with token security
//
// Security Model:
// - Uses OpenZeppelin OwnableComponent for access control
// - Uses OpenZeppelin PausableComponent for emergency stop
// - Caller must approve Factory to spend the tokens BEFORE calling deploy_schedule
// - Factory pulls tokens from caller and transfers to the Schedule contract
// - Only tokens approved by the caller can be used for their schedule
// - Maximum amount limit to prevent abuse
// - Reasonable start_time validation window
// - Minimum duration to prevent abuse
// - Deploy guard for atomic operations
// - Rollback on deployment failure (F-001, F-002)
// - Balance check before deployment (F-004)
// - Emergency token recovery (F-005)
// - Auto-registers plans in Registry (optional)

use chrono_plan::domain::types::schedule::DeploymentSpec;
use chrono_plan::interfaces::i_factory::IFactory;
use chrono_plan::interfaces::i_registry::{IRegistryDispatcher, IRegistryDispatcherTrait};
use core::array::ArrayTrait;
use core::serde::Serde;
use openzeppelin_access::ownable::OwnableComponent;
use openzeppelin_security::pausable::PausableComponent;
use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
use starknet::syscalls::deploy_syscall;
use starknet::{ClassHash, ContractAddress};

// Security constants
const MAX_AMOUNT: u256 = 1000000000000000000000000_u256; // 1 million tokens with 18 decimals
const MIN_DURATION: u64 = 60; // Minimum 60 seconds duration
const MAX_START_TIME_FUTURE: u64 = 2592000; // 30 days in seconds
const MAX_START_TIME_PAST: u64 = 300; // 5 minutes in seconds

// ERC20 interface for token operations
#[starknet::interface]
pub trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, from: ContractAddress, to: ContractAddress, amount: u256,
    ) -> bool;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
}

// Admin interface - uses OpenZeppelin Ownable and Pausable
#[starknet::interface]
pub trait IAdmin<TContractState> {
    fn set_schedule_class_hash(ref self: TContractState, class_hash: ClassHash);
    fn set_registry(ref self: TContractState, registry: ContractAddress);
    fn recover_erc20(ref self: TContractState, token_address: ContractAddress, amount: u256);
}

#[starknet::contract]
mod Factory {
    use starknet::SyscallResultTrait;
    use super::{*, IERC20Dispatcher};

    // Declare OpenZeppelin components
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);

    // Import Ownable internal impl
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Import Pausable internal impl
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    // Ownable Mixin
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;

    // Pausable Mixin
    impl PausableMixinImpl = PausableComponent::PausableImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage,
        plan_count: felt252,
        schedule_class_hash: ClassHash,
        deploy_guard: u8,
        registry_address: ContractAddress,
    }

    // Event structs - defined BEFORE enum
    #[derive(Drop, Serde, starknet::Event)]
    struct ScheduleDeployed {
        #[key]
        plan_id: felt252,
        #[key]
        schedule_address: ContractAddress,
        recipient: ContractAddress,
        governance_address: ContractAddress,
        funder: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, Serde, starknet::Event)]
    struct DeploymentFailed {
        #[key]
        plan_id: felt252,
        funder: ContractAddress,
        amount: u256,
        reason: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct ClassHashSet {
        class_hash: ClassHash,
    }

    #[derive(Drop, starknet::Event)]
    struct EmergencyRecovery {
        token_address: ContractAddress,
        recipient: ContractAddress,
        amount: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ScheduleDeployed: ScheduleDeployed,
        DeploymentFailed: DeploymentFailed,
        ClassHashSet: ClassHashSet,
        EmergencyRecovery: EmergencyRecovery,
        // OpenZeppelin component events
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        PausableEvent: PausableComponent::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.ownable.initializer(admin);
        self.plan_count.write(0);
        self.deploy_guard.write(0);
    }

    #[generate_trait]
    impl Internal of InternalTrait {
        fn deploy_schedule_impl(
            ref self: ContractState,
            recipient: ContractAddress,
            amount: u256,
            start_time: u64,
            duration: u64,
            curve_key: felt252,
            curve_params: felt252,
            token_address: ContractAddress,
            governance_address: ContractAddress,
        ) -> ContractAddress {
            // CHECKS: Validate all inputs first
            self.pausable.assert_not_paused();
            assert(amount <= MAX_AMOUNT, 'Amount exceeds maximum');
            assert(amount > 0_u256, 'Amount must be positive');
            assert(duration >= MIN_DURATION, 'Duration too short');
            assert(recipient.into() != 0, 'Invalid recipient');
            assert(token_address.into() != 0, 'Invalid token');
            assert(governance_address.into() != 0, 'Invalid governance');
            let caller = starknet::get_caller_address();
            assert(caller.into() != 0, 'Invalid caller');

            // Validate curve_key
            let valid_curve = curve_key == 'LINEAR'
                || curve_key == 'CLIFF'
                || curve_key == 'EXP_DECAY';
            assert(valid_curve, 'Invalid curve');

            // Validate start_time is within reasonable window
            let now = starknet::get_block_info().unbox().block_timestamp;
            assert(start_time >= now - MAX_START_TIME_PAST, 'Start time too far in past');
            assert(start_time <= now + MAX_START_TIME_FUTURE, 'Start time too far in future');

            // Atomic deployment with guard
            assert(self.deploy_guard.read() == 0, 'Deployment in progress');
            self.deploy_guard.write(1);

            // EFFECTS: Update state before external calls
            let plan_id = self.plan_count.read();
            self.plan_count.write(plan_id + 1);

            // INTERACTIONS: External calls
            let token = IERC20Dispatcher { contract_address: token_address };
            let factory_address = starknet::get_contract_address();

            // Check BOTH allowance AND balance
            let allowance: u256 = token.allowance(caller, factory_address);
            assert(allowance >= amount, 'Insufficient allowance');
            let caller_balance: u256 = token.balance_of(caller);
            assert(caller_balance >= amount, 'Insufficient balance');

            // Pull tokens from caller
            let pull_success = token.transfer_from(caller, factory_address, amount);
            assert(pull_success, 'Transfer from failed');

            // Build deployment spec
            let spec = DeploymentSpec {
                recipient,
                amount,
                start_time,
                duration,
                curve_key,
                curve_params,
                token_address,
                governance_address,
            };

            let mut constructor_calldata = ArrayTrait::new();
            plan_id.serialize(ref constructor_calldata);
            spec.serialize(ref constructor_calldata);

            let schedule_class_hash = self.schedule_class_hash.read();
            assert(schedule_class_hash.into() != 0, 'Class hash not set');

            // Try deployment
            let deployment_result = deploy_syscall(
                schedule_class_hash, plan_id, constructor_calldata.span(), true,
            );

            // Handle deployment result
            if deployment_result.is_ok() {
                let (schedule_address, _) = deployment_result.unwrap_syscall();

                // Transfer to schedule
                let transfer_success = token.transfer(schedule_address, amount);

                if transfer_success {
                    // Success path
                    self.deploy_guard.write(0);

                    // Register in Registry if configured
                    let registry = self.registry_address.read();
                    if registry.into() != 0 {
                        let registry_dispatcher = IRegistryDispatcher {
                            contract_address: registry,
                        };
                        registry_dispatcher
                            .register_plan(
                                plan_id,
                                schedule_address,
                                recipient,
                                caller,
                                amount,
                                token_address,
                                curve_key,
                            );
                    }

                    self
                        .emit(
                            ScheduleDeployed {
                                plan_id,
                                schedule_address,
                                recipient,
                                governance_address,
                                funder: caller,
                                amount,
                            },
                        );
                    return schedule_address;
                } else {
                    // Transfer to schedule failed - ROLLBACK
                    self.deploy_guard.write(0);
                    let rollback_success = token.transfer(caller, amount);
                    if !rollback_success {
                        self
                            .emit(
                                DeploymentFailed {
                                    plan_id, funder: caller, amount, reason: 'Rollback failed',
                                },
                            );
                        panic(array!['Transfer to schedule failed']);
                    }
                    self
                        .emit(
                            DeploymentFailed {
                                plan_id,
                                funder: caller,
                                amount,
                                reason: 'Transfer to schedule failed',
                            },
                        );
                    panic(array!['Transfer to schedule failed']);
                }
            } else {
                // Deployment failed - ROLLBACK
                self.deploy_guard.write(0);
                let rollback_success = token.transfer(caller, amount);
                if !rollback_success {
                    self
                        .emit(
                            DeploymentFailed {
                                plan_id, funder: caller, amount, reason: 'Rollback failed',
                            },
                        );
                    panic(array!['Deployment failed']);
                }
                self
                    .emit(
                        DeploymentFailed {
                            plan_id, funder: caller, amount, reason: 'Deploy syscall failed',
                        },
                    );
                panic(array!['Deployment failed']);
            }
        }
    }

    #[abi(embed_v0)]
    impl FactoryImpl of IFactory<ContractState> {
        fn deploy_schedule(
            ref self: ContractState,
            recipient: ContractAddress,
            amount: u256,
            start_time: u64,
            duration: u64,
            curve_key: felt252,
            curve_params: felt252,
            token_address: ContractAddress,
            governance_address: ContractAddress,
        ) -> ContractAddress {
            self
                .deploy_schedule_impl(
                    recipient,
                    amount,
                    start_time,
                    duration,
                    curve_key,
                    curve_params,
                    token_address,
                    governance_address,
                )
        }

        fn get_plan_counter(self: @ContractState) -> u256 {
            self.plan_count.read().into()
        }

        fn version(self: @ContractState) -> felt252 {
            'v1.4.0'
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.ownable.owner()
        }

        fn is_paused(self: @ContractState) -> bool {
            self.pausable.is_paused()
        }

        fn get_schedule_class_hash(self: @ContractState) -> ClassHash {
            self.schedule_class_hash.read()
        }
    }

    #[abi(embed_v0)]
    impl AdminFunctions of IAdmin<ContractState> {
        fn set_schedule_class_hash(ref self: ContractState, class_hash: ClassHash) {
            self.ownable.assert_only_owner();
            assert(class_hash.into() != 0, 'Invalid class hash');
            self.schedule_class_hash.write(class_hash);
            self.emit(ClassHashSet { class_hash });
        }

        fn set_registry(ref self: ContractState, registry: ContractAddress) {
            self.ownable.assert_only_owner();
            self.registry_address.write(registry);
        }

        fn recover_erc20(ref self: ContractState, token_address: ContractAddress, amount: u256) {
            self.ownable.assert_only_owner();
            assert(token_address.into() != 0, 'Invalid token');
            assert(amount > 0_u256, 'Invalid amount');

            let token = IERC20Dispatcher { contract_address: token_address };
            let factory_balance = token.balance_of(starknet::get_contract_address());
            assert(factory_balance >= amount, 'Insufficient balance');

            let success = token.transfer(self.ownable.owner(), amount);
            assert(success, 'Recovery transfer failed');

            self.emit(EmergencyRecovery { token_address, recipient: self.ownable.owner(), amount });
        }
    }
}
