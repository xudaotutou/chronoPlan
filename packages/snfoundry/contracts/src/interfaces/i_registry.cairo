// SPDX-License-Identifier: MIT
// Module: interfaces::i_registry
// Version: v1.0.0
// Description: Registry contract interface for indexing all Schedule plans

use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
pub struct PlanInfo {
    pub schedule_address: ContractAddress,
    pub recipient: ContractAddress,
    pub funder: ContractAddress,
    pub amount: u256,
    pub token_address: ContractAddress,
    pub curve_key: felt252,
    pub created_at: u64,
}

#[starknet::interface]
pub trait IRegistry<TContractState> {
    fn register_plan(
        ref self: TContractState,
        plan_id: felt252,
        schedule_address: ContractAddress,
        recipient: ContractAddress,
        funder: ContractAddress,
        amount: u256,
        token_address: ContractAddress,
        curve_key: felt252,
    );

    fn get_plan_info(self: @TContractState, plan_id: felt252) -> PlanInfo;
    fn get_total_plans(self: @TContractState) -> u256;
    fn get_plans_by_recipient(self: @TContractState, recipient: ContractAddress) -> Array<felt252>;
    fn get_plans_by_funder(self: @TContractState, funder: ContractAddress) -> Array<felt252>;
    fn get_plan_count_by_recipient(self: @TContractState, recipient: ContractAddress) -> u32;
    fn get_plan_count_by_funder(self: @TContractState, funder: ContractAddress) -> u32;
    fn is_registered(self: @TContractState, schedule_address: ContractAddress) -> bool;
}

#[starknet::interface]
pub trait IRegistryAdmin<TContractState> {
    fn set_factory(ref self: TContractState, factory: ContractAddress);
    fn get_factory(self: @TContractState) -> ContractAddress;
}
