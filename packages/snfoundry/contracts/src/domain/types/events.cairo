// SPDX-License-Identifier: MIT
// Module: domain::types::events
// Version: v1.0.0
// Author: @architect
// Last Modified: 2026-04-06
// Description:
// Domain event data structures. These are shared definitions for documentation
// and type consistency. Each contract defines its own Event enum with
// #[derive(starknet::Event)] on structs defined inside the contract module.
//
// Key event patterns:
//   - Use #[key] on fields that should be indexed for filtering
//   - Events are defined inside #[starknet::contract] modules
//   - Each Event enum variant represents an emit-able event
//
use starknet::{ClassHash, ContractAddress};

// ============================================================================
// Schedule Events - Emitted by Schedule contracts
// ============================================================================

/// Event data for schedule creation
/// Note: Struct defined in schedule_proxy.cairo with #[derive(starknet::Event)]
pub struct ScheduleCreated {
    pub plan_id: felt252,
    pub recipient: ContractAddress,
    pub amount: u256,
    pub start_time: u64,
    pub duration: u64,
    pub curve_key: felt252,
    pub token_address: ContractAddress,
}

/// Event data for token claims
/// Note: Struct defined in schedule_proxy.cairo with #[derive(starknet::Event)]
pub struct Claimed {
    pub plan_id: felt252,
    pub recipient: ContractAddress,
    pub amount: u256,
    pub claimed_at: u64,
    pub total_claimed: u256,
}

/// Event data for schedule closure
/// Note: Struct defined in schedule_proxy.cairo with #[derive(starknet::Event)]
pub struct ScheduleClosed {
    pub plan_id: felt252,
    pub closed_by: ContractAddress,
    pub refund_address: ContractAddress,
    pub remaining_amount: u256,
    pub closed_at: u64,
}

/// Event data for schedule completion
/// Note: Struct defined in schedule_proxy.cairo with #[derive(starknet::Event)]
pub struct ScheduleCompleted {
    pub plan_id: felt252,
    pub recipient: ContractAddress,
    pub total_released: u256,
    pub final_amount: u256,
    pub completed_at: u64,
}

// ============================================================================
// Factory Events - Emitted by Factory contract
// ============================================================================

/// Event data for schedule deployment
/// Note: Struct defined in factory.cairo with #[derive(starknet::Event)]
pub struct ScheduleDeployed {
    pub plan_id: felt252,
    pub schedule_address: ContractAddress,
    pub recipient: ContractAddress,
    pub amount: u256,
    pub curve_key: felt252,
    pub governance_address: ContractAddress,
}

/// Event data for curve registration
/// Note: Struct defined in factory.cairo with #[derive(starknet::Event)]
pub struct CurveRegistered {
    pub curve_key: felt252,
    pub class_hash: ClassHash,
    pub version: felt252,
}

/// Event data for curve updates
/// Note: Struct defined in factory.cairo with #[derive(starknet::Event)]
pub struct CurveUpdated {
    pub curve_key: felt252,
    pub old_class_hash: ClassHash,
    pub new_class_hash: ClassHash,
    pub version: felt252,
}

// ============================================================================
// Registry Events - Emitted by Registry contract
// ============================================================================

/// Event data for version registration
/// Note: Struct defined in registry.cairo with #[derive(starknet::Event)]
pub struct VersionRegistered {
    pub version: felt252,
    pub class_hash: ClassHash,
    pub is_latest: bool,
}
