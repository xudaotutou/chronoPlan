// SPDX-License-Identifier: MIT
// Module: domain::types::schedule
// Version: v1.0.0
// Author: @architect
// Last Modified: 2026-04-06
// Description: Core schedule data structures

use starknet::ContractAddress;

/// Deployment specification for creating a new Schedule Plan
#[derive(Drop, Serde, starknet::Store, Clone)]
pub struct DeploymentSpec {
    pub recipient: ContractAddress,
    pub amount: u256,
    pub start_time: u64,
    pub duration: u64,
    pub curve_key: felt252,
    pub curve_params: felt252,
    pub token_address: ContractAddress,
    pub governance_address: ContractAddress,
}

/// Metadata for registered curve implementations
#[derive(Drop, Serde, starknet::Store, Clone)]
pub struct CurveMetadata {
    pub name: felt252,
    pub version: felt252,
    pub audit_uri: felt252,
    pub gas_estimate: u64,
}

/// Plan info - stored state of a deployed schedule
/// Similar to DeploymentSpec but used for on-chain storage
#[derive(Drop, Serde, starknet::Store, Clone)]
pub struct PlanInfo {
    pub recipient: ContractAddress,
    pub amount: u256,
    pub start_time: u64,
    pub duration: u64,
    pub curve_key: felt252,
    pub curve_params: felt252,
    pub token_address: ContractAddress,
}

/// Plan execution status
#[derive(Drop, PartialEq, Serde, Clone, starknet::Store)]
pub enum PlanStatus {
    #[default]
    Active,
    Completed,
    Closed,
}

/// Version info
#[derive(Drop, Serde, starknet::Store, Clone)]
pub struct VersionInfo {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub is_active: bool,
    pub registered_at: u64,
}
