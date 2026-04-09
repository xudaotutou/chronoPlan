// SPDX-License-Identifier: MIT
// Module: domain::types
// Version: v1.0.0
// Author: @architect
// Last Modified: 2026-04-06
// Description: Domain types - core data structures

pub mod events;
pub mod schedule;

// Re-export for easier access
pub use schedule::DeploymentSpec;
pub use schedule::{CurveMetadata, PlanStatus, VersionInfo};
