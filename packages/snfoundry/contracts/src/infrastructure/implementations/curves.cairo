// SPDX-License-Identifier: MIT
// Module: infrastructure::implementations::curves
// Version: v1.0.0
// Responsibility: Math/Algorithm Engineer
// Last Modified: 2026-04-06
// Description: Curve algorithm implementations for vesting schedules
//
// Supported Curves:
//   - Linear:     Uniform release over duration
//   - Cliff:      Immediate release after cliff period
//   - ExpDecay:   Exponential decay release pattern

pub mod cliff;
pub mod exp_decay;
pub mod linear;
