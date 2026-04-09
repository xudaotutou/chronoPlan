// SPDX-License-Identifier: MIT
// Module: infrastructure::implementations::governance::single_admin
// Version: v1.0.0
// Description: Single administrator governance implementation

use starknet::ContractAddress;
use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
use crate::domain::traits::governance::IGovernance;

const GOVERNANCE_TYPE: felt252 = 'SINGLE_ADMIN';
const VERSION: felt252 = 'v1.0.0';

#[starknet::contract]
mod SingleAdminGovernance {
    use super::*;

    #[storage]
    struct Storage {
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OwnerUpdated: OwnerUpdatedEvent,
    }

    #[derive(Drop, starknet::Event)]
    struct OwnerUpdatedEvent {
        old_owner: ContractAddress,
        new_owner: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        assert(owner.into() != 0, 'Invalid owner');
        self.owner.write(owner);
    }

    #[abi(embed_v0)]
    impl GovernanceImpl of IGovernance<ContractState> {
        fn is_governance(self: @ContractState, caller: ContractAddress) -> bool {
            self.owner.read() == caller
        }

        fn governance_type(self: @ContractState) -> felt252 {
            GOVERNANCE_TYPE
        }
    }

    #[abi(embed_v0)]
    impl OwnerActions of super::IOwnerActions<ContractState> {
        fn set_owner(ref self: ContractState, new_owner: ContractAddress) {
            let caller = starknet::get_caller_address();
            assert(self.owner.read() == caller, 'Caller is not the owner');
            assert(new_owner.into() != 0, 'Invalid owner');
            let old_owner = self.owner.read();
            if old_owner != new_owner {
                self.owner.write(new_owner);
                self.emit(OwnerUpdatedEvent { old_owner, new_owner });
            }
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }
    }
}

#[starknet::interface]
pub trait IOwnerActions<TContractState> {
    fn set_owner(ref self: TContractState, new_owner: ContractAddress);
    fn get_owner(self: @TContractState) -> ContractAddress;
}
