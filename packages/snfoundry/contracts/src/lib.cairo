// SPDX-License-Identifier: MIT
// ChronoPlan - Modular TWAMM Schedule System
// Version: v1.0.0
// Description: Time-Weighted Average Mass Meeting Schedule System
//
// Architecture:
//   - domain/     : Core domain layer - types, events, and traits
//   - interfaces/ : External contract interfaces
//   - infrastructure/adapters/ : External system adapters (token, time)
//   - application/    : Business logic contracts
//
// Dependencies:
//   - openzeppelin_access (access control)
//   - openzeppelin_security (pausable)
//   - openzeppelin_interfaces (ERC20 interfaces)
// Note: infrastructure::implementations (governance/curves) are NOT exported
//       They are standalone contracts that should be compiled separately.

pub mod application;
pub mod domain;
pub mod infrastructure;
pub mod interfaces;
