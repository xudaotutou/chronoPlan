// SPDX-License-Identifier: MIT
// Module: interfaces::i_factory
// Version: v1.4.0
// Description: Factory contract external interface
//
// Note: deploy_schedule uses individual parameters instead of a struct
// to simplify frontend integration with starknet.js

use starknet::{ClassHash, ContractAddress};

#[starknet::interface]
pub trait IFactory<TContractState> {
    fn deploy_schedule(
        ref self: TContractState,
        recipient: ContractAddress,
        amount: u256,
        start_time: u64,
        duration: u64,
        curve_key: felt252,
        curve_params: felt252,
        token_address: ContractAddress,
        governance_address: ContractAddress,
    ) -> ContractAddress;

    fn get_plan_counter(self: @TContractState) -> u256;
    fn version(self: @TContractState) -> felt252;
    fn get_admin(self: @TContractState) -> ContractAddress;
    fn get_schedule_class_hash(self: @TContractState) -> ClassHash;
    fn is_paused(self: @TContractState) -> bool;
}

// Admin interface - implements OpenZeppelin Ownable for ownership
// Note: pause/unpause/transfer_ownership are handled by OwnableComponent
#[starknet::interface]
pub trait IAdmin<TContractState> {
    fn set_schedule_class_hash(ref self: TContractState, class_hash: ClassHash);
    fn recover_erc20(ref self: TContractState, token_address: ContractAddress, amount: u256);
}
