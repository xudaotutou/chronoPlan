// SPDX-License-Identifier: MIT
// Module: application::schedule_proxy
// Version: v1.5.0
// Description: Schedule contract for token vesting with pluggable curves
//
// Security Features:
// - Uses OpenZeppelin ReentrancyGuardComponent for reentrancy protection
// - Uses OpenZeppelin UpgradeableComponent for contract upgrades
// - CEI pattern (Checks-Effects-Interactions)
// - Safe integer arithmetic in curves
//
// Governance: Uses governance_address stored in contract
// plan_id: Unique identifier for this schedule

use chrono_plan::domain::types::schedule::{DeploymentSpec, PlanStatus};
use chrono_plan::infrastructure::implementations::curves::cliff::CliffCurve;
use chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve;
use chrono_plan::infrastructure::implementations::curves::linear::LinearCurve;
use chrono_plan::interfaces::i_schedule::{ISchedule, IUpgradeable};
use core::array::ArrayTrait;
use openzeppelin_security::reentrancyguard::ReentrancyGuardComponent;
use openzeppelin_upgrades::UpgradeableComponent;
use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
use starknet::{ClassHash, ContractAddress};

// ERC20 interface for token operations
#[starknet::interface]
pub trait IERC20<T> {
    fn transfer(ref self: T, recipient: ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @T, account: ContractAddress) -> u256;
}

#[starknet::contract]
mod ScheduleProxy {
    use super::*;

    // Declare OpenZeppelin components using the component! macro
    component!(
        path: ReentrancyGuardComponent, storage: reentrancy_guard, event: ReentrancyGuardEvent,
    );
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Import ReentrancyGuard internal impl for internal functions
    impl ReentrancyGuardInternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    // Import Upgradeable internal impl for internal functions
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        reentrancy_guard: ReentrancyGuardComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        plan_id: felt252,
        recipient: ContractAddress,
        amount: u256,
        start_time: u64,
        duration: u64,
        curve_key: felt252,
        curve_params: felt252,
        token_address: ContractAddress,
        claimed: u256,
        status: PlanStatus,
        governance_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ScheduleCreated: ScheduleCreated,
        Claimed: Claimed,
        ScheduleClosed: ScheduleClosed,
        ScheduleCompleted: ScheduleCompleted,
        // OpenZeppelin component events
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[derive(Drop, Serde, starknet::Event)]
    struct ScheduleCreated {
        #[key]
        plan_id: felt252,
        schedule_address: ContractAddress,
        recipient: ContractAddress,
        governance_address: ContractAddress,
        amount: u256,
        start_time: u64,
        duration: u64,
        curve_key: felt252,
        token_address: ContractAddress,
    }

    #[derive(Drop, Serde, starknet::Event)]
    struct Claimed {
        #[key]
        recipient: ContractAddress,
        amount: u256,
        total_claimed: u256,
    }

    #[derive(Drop, Serde, starknet::Event)]
    struct ScheduleClosed {
        #[key]
        refunded_address: ContractAddress,
        refunded_amount: u256,
    }

    #[derive(Drop, Serde, starknet::Event)]
    struct ScheduleCompleted {
        #[key]
        recipient: ContractAddress,
        total_claimed: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, plan_id: felt252, spec: DeploymentSpec) {
        assert(spec.recipient.into() != 0, 'Invalid recipient');
        assert(spec.amount > 0_u256, 'Invalid amount');
        assert(spec.duration > 0_u64, 'Invalid duration');
        assert(spec.token_address.into() != 0, 'Invalid token');
        assert(spec.governance_address.into() != 0, 'Invalid governance');

        self.plan_id.write(plan_id);
        self.recipient.write(spec.recipient);
        self.amount.write(spec.amount);
        self.start_time.write(spec.start_time);
        self.duration.write(spec.duration);
        self.curve_key.write(spec.curve_key);
        self.curve_params.write(spec.curve_params);
        self.token_address.write(spec.token_address);
        self.status.write(PlanStatus::Active);
        self.claimed.write(0);
        self.governance_address.write(spec.governance_address);

        self
            .emit(
                ScheduleCreated {
                    plan_id,
                    schedule_address: starknet::get_contract_address(),
                    recipient: spec.recipient,
                    governance_address: spec.governance_address,
                    amount: spec.amount,
                    start_time: spec.start_time,
                    duration: spec.duration,
                    curve_key: spec.curve_key,
                    token_address: spec.token_address,
                },
            );
    }

    #[generate_trait]
    impl Internal of InternalTrait {
        fn claim_impl(ref self: ContractState) {
            assert(self.status.read() == PlanStatus::Active, 'Not active');
            // Use OpenZeppelin ReentrancyGuardComponent
            self.reentrancy_guard.start();

            let caller = starknet::get_caller_address();
            let recipient = self.recipient.read();
            assert(caller == recipient, 'Not recipient');

            let elapsed = get_elapsed(self.start_time.read());
            let amount = self.amount.read();
            let curve_key = self.curve_key.read();
            let curve_params = self.curve_params.read();
            let duration = self.duration.read();

            let vested = calc_vested(elapsed, duration, amount, curve_key, curve_params);
            let claimed = self.claimed.read();
            let available = vested - claimed;

            assert(available > 0_u256, 'Nothing to claim');

            self.claimed.write(vested);
            if vested >= amount {
                self.status.write(PlanStatus::Completed);
            }

            self.do_transfer(recipient, available);

            // Use OpenZeppelin ReentrancyGuardComponent
            self.reentrancy_guard.end();

            if vested >= amount {
                self.emit(ScheduleCompleted { recipient, total_claimed: vested });
            }
            self.emit(Claimed { recipient, amount: available, total_claimed: vested });
        }

        fn close_impl(ref self: ContractState, refund_address: ContractAddress) {
            self.assert_is_governance();
            // Use OpenZeppelin ReentrancyGuardComponent
            self.reentrancy_guard.start();
            assert(refund_address.into() != 0, 'Invalid refund address');
            assert(self.status.read() == PlanStatus::Active, 'Already closed/completed');

            let claimed = self.claimed.read();
            let amount = self.amount.read();
            let remaining = amount - claimed;

            self.status.write(PlanStatus::Closed);

            if remaining > 0_u256 {
                self.do_transfer(refund_address, remaining);
            }

            // Use OpenZeppelin ReentrancyGuardComponent
            self.reentrancy_guard.end();

            self
                .emit(
                    ScheduleClosed { refunded_address: refund_address, refunded_amount: remaining },
                );
        }

        fn finalize_impl(ref self: ContractState) {
            assert(self.status.read() == PlanStatus::Active, 'Not active');
            // Use OpenZeppelin ReentrancyGuardComponent
            self.reentrancy_guard.start();

            let caller = starknet::get_caller_address();
            let recipient = self.recipient.read();
            assert(caller == recipient, 'Not recipient');

            let elapsed = get_elapsed(self.start_time.read());
            let duration = self.duration.read();
            assert(elapsed >= duration, 'Not ended');

            let amount = self.amount.read();
            let claimed = self.claimed.read();
            let remaining = amount - claimed;

            self.claimed.write(amount);
            self.status.write(PlanStatus::Completed);

            if remaining > 0_u256 {
                self.do_transfer(recipient, remaining);
            }

            // Use OpenZeppelin ReentrancyGuardComponent
            self.reentrancy_guard.end();

            if remaining > 0_u256 {
                self.emit(ScheduleCompleted { recipient, total_claimed: amount });
            }
        }

        fn do_transfer(self: @ContractState, to: ContractAddress, amount: u256) {
            let token_addr = self.token_address.read();
            let token = IERC20Dispatcher { contract_address: token_addr };
            let success = token.transfer(to, amount);
            assert(success, 'Transfer failed');
        }

        fn assert_is_governance(self: @ContractState) {
            let caller = starknet::get_caller_address();
            assert(caller == self.governance_address.read(), 'Not governance');
        }
    }

    #[abi(embed_v0)]
    impl ScheduleImpl of ISchedule<ContractState> {
        fn claim(ref self: ContractState) {
            self.claim_impl();
        }

        fn get_available(self: @ContractState) -> u256 {
            if self.status.read() != PlanStatus::Active {
                return 0_u256;
            }
            let elapsed = get_elapsed(self.start_time.read());
            let amount = self.amount.read();
            let curve_key = self.curve_key.read();
            let curve_params = self.curve_params.read();
            let duration = self.duration.read();

            let vested = calc_vested(elapsed, duration, amount, curve_key, curve_params);
            let claimed = self.claimed.read();
            if vested > claimed {
                vested - claimed
            } else {
                0_u256
            }
        }

        fn get_status(self: @ContractState) -> PlanStatus {
            self.status.read()
        }

        fn close(ref self: ContractState, refund_address: ContractAddress) {
            self.close_impl(refund_address);
        }

        fn finalize(ref self: ContractState) {
            self.finalize_impl();
        }

        fn get_recipient(self: @ContractState) -> ContractAddress {
            self.recipient.read()
        }

        fn get_amount(self: @ContractState) -> u256 {
            self.amount.read()
        }

        fn get_claimed(self: @ContractState) -> u256 {
            self.claimed.read()
        }

        fn get_plan_id(self: @ContractState) -> felt252 {
            self.plan_id.read()
        }

        fn get_curve_name(self: @ContractState) -> felt252 {
            self.curve_key.read()
        }

        fn get_governance_address(self: @ContractState) -> ContractAddress {
            self.governance_address.read()
        }
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_impl: ClassHash) {
            self.assert_is_governance();
            // Use OpenZeppelin UpgradeableComponent
            self.upgradeable.upgrade(new_impl);
        }

        fn get_implementation(self: @ContractState) -> ClassHash {
            // This is now handled by the UpgradeableComponent's Upgraded event
            // Return zero as we don't store implementation separately anymore
            0.try_into().unwrap()
        }
    }
}

fn get_elapsed(start_time: u64) -> u64 {
    let now = starknet::get_block_info().unbox().block_timestamp;
    if now > start_time {
        now - start_time
    } else {
        0
    }
}

fn calc_vested(
    elapsed: u64, duration: u64, amount: u256, curve_key: felt252, curve_params: felt252,
) -> u256 {
    if elapsed >= duration {
        return amount;
    }
    if duration == 0 {
        return amount;
    }

    if curve_key == 'LINEAR' {
        LinearCurve::calculate(amount, curve_params, elapsed, duration)
    } else if curve_key == 'CLIFF' {
        CliffCurve::calculate(amount, curve_params, elapsed, duration)
    } else if curve_key == 'EXP_DECAY' {
        ExpDecayCurve::calculate(amount, curve_params, elapsed, duration)
    } else {
        LinearCurve::calculate(amount, curve_params, elapsed, duration)
    }
}
