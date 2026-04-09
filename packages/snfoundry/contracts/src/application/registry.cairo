// SPDX-License-Identifier: MIT
// Module: application::registry
// Version: v1.0.0
// Description: Registry contract for indexing all Schedule plans
//
// Features:
// - Index plans by recipient for easy querying
// - Index plans by funder for tracking deployed plans
// - Fast lookup by schedule address
// - Only Factory can register plans (controlled by admin)
//
// Security:
// - Uses OpenZeppelin OwnableComponent for access control
// - Only registered factory can call register_plan

use chrono_plan::interfaces::i_registry::{IRegistry, IRegistryAdmin, PlanInfo};
use core::array::ArrayTrait;
use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
    StoragePointerWriteAccess,
};
use starknet::{ContractAddress, get_block_info, get_caller_address};

// Registry contract
#[starknet::contract]
mod Registry {
    use openzeppelin_access::ownable::OwnableComponent;
    use super::*;

    // Declare OpenZeppelin Ownable component
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // Import Ownable internal impl
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        plan_count: u256,
        // plan_id -> PlanInfo
        plan_info: Map<felt252, PlanInfo>,
        // recipient -> Array<plan_id> (count stored separately)
        recipient_plan_count: Map<ContractAddress, u32>,
        recipient_plan_ids: Map<(ContractAddress, u32), felt252>,
        // funder -> Array<plan_id> (count stored separately)
        funder_plan_count: Map<ContractAddress, u32>,
        funder_plan_ids: Map<(ContractAddress, u32), felt252>,
        // schedule_address -> bool (for fast lookup)
        schedule_exists: Map<ContractAddress, bool>,
        // authorized factory contract
        factory: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PlanRegistered: PlanRegistered,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[derive(Drop, Serde, starknet::Event)]
    struct PlanRegistered {
        #[key]
        plan_id: felt252,
        schedule_address: ContractAddress,
        recipient: ContractAddress,
        funder: ContractAddress,
        amount: u256,
        token_address: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.ownable.initializer(admin);
        self.plan_count.write(0);
    }

    #[generate_trait]
    impl Internal of InternalTrait {
        fn append_to_recipient_plans(
            ref self: ContractState, recipient: ContractAddress, plan_id: felt252,
        ) -> u32 {
            let count = self.recipient_plan_count.read(recipient);
            let new_count = count + 1;
            self.recipient_plan_ids.write((recipient, new_count), plan_id);
            self.recipient_plan_count.write(recipient, new_count);
            new_count
        }

        fn append_to_funder_plans(
            ref self: ContractState, funder: ContractAddress, plan_id: felt252,
        ) -> u32 {
            let count = self.funder_plan_count.read(funder);
            let new_count = count + 1;
            self.funder_plan_ids.write((funder, new_count), plan_id);
            self.funder_plan_count.write(funder, new_count);
            new_count
        }
    }

    #[abi(embed_v0)]
    impl RegistryImpl of IRegistry<ContractState> {
        fn register_plan(
            ref self: ContractState,
            plan_id: felt252,
            schedule_address: ContractAddress,
            recipient: ContractAddress,
            funder: ContractAddress,
            amount: u256,
            token_address: ContractAddress,
            curve_key: felt252,
        ) {
            // Only authorized factory can register
            let caller = get_caller_address();
            assert(caller == self.factory.read(), 'Caller is not factory');

            // Prevent duplicate registrations
            assert(!self.schedule_exists.read(schedule_address), 'Already registered');

            let now = get_block_info().unbox().block_timestamp;

            // Store plan info
            let plan_info = PlanInfo {
                schedule_address,
                recipient,
                funder,
                amount,
                token_address,
                curve_key,
                created_at: now,
            };
            self.plan_info.write(plan_id, plan_info);

            // Add to recipient's plan list
            self.append_to_recipient_plans(recipient, plan_id);

            // Add to funder's plan list
            self.append_to_funder_plans(funder, plan_id);

            // Mark as registered
            self.schedule_exists.write(schedule_address, true);

            // Increment total count
            self.plan_count.write(self.plan_count.read() + 1);

            // Emit event
            self
                .emit(
                    PlanRegistered {
                        plan_id, schedule_address, recipient, funder, amount, token_address,
                    },
                );
        }

        fn get_plan_info(self: @ContractState, plan_id: felt252) -> PlanInfo {
            self.plan_info.read(plan_id)
        }

        fn get_total_plans(self: @ContractState) -> u256 {
            self.plan_count.read()
        }

        fn get_plans_by_recipient(
            self: @ContractState, recipient: ContractAddress,
        ) -> Array<felt252> {
            let count = self.recipient_plan_count.read(recipient);
            let mut result = ArrayTrait::new();

            let mut i = 1;
            loop {
                if i > count {
                    break;
                }
                let plan_id = self.recipient_plan_ids.read((recipient, i));
                result.append(plan_id);
                i += 1;
            }

            result
        }

        fn get_plans_by_funder(self: @ContractState, funder: ContractAddress) -> Array<felt252> {
            let count = self.funder_plan_count.read(funder);
            let mut result = ArrayTrait::new();

            let mut i = 1;
            loop {
                if i > count {
                    break;
                }
                let plan_id = self.funder_plan_ids.read((funder, i));
                result.append(plan_id);
                i += 1;
            }

            result
        }

        fn get_plan_count_by_recipient(self: @ContractState, recipient: ContractAddress) -> u32 {
            self.recipient_plan_count.read(recipient)
        }

        fn get_plan_count_by_funder(self: @ContractState, funder: ContractAddress) -> u32 {
            self.funder_plan_count.read(funder)
        }

        fn is_registered(self: @ContractState, schedule_address: ContractAddress) -> bool {
            self.schedule_exists.read(schedule_address)
        }
    }

    #[abi(embed_v0)]
    impl RegistryAdminImpl of IRegistryAdmin<ContractState> {
        fn set_factory(ref self: ContractState, factory: ContractAddress) {
            self.ownable.assert_only_owner();
            assert(factory.into() != 0, 'Invalid factory');
            self.factory.write(factory);
        }

        fn get_factory(self: @ContractState) -> ContractAddress {
            self.factory.read()
        }
    }
}
