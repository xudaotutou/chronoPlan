// SPDX-License-Identifier: MIT
// Module: infrastructure::implementations::governance
// Version: v1.0.0
// Responsibility: Security Engineer
// Last Modified: 2026-04-06
// Description: Governance implementations for schedule operations
//
// Supported Governance Modes:
//   - SingleAdmin: OpenZeppelin Ownable-based single owner
//   - Multisig: External multisig wallet (Argent, Braavos, custom)
//   - DAO: OpenZeppelin Governor-style voting
//
// Usage:
//   Deploy the appropriate governance contract and set its address
//   as the governance_address in DeploymentSpec when creating schedules.

pub mod dao;
pub mod multisig;
pub mod single_admin;
