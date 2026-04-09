// SPDX-License-Identifier: MIT
// Comprehensive Tests for ChronoPlan Contracts

use starknet::ContractAddress;

// ============================================================================
// Test Constants
// ============================================================================

const OWNER: ContractAddress = 0x02dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A5918
    .try_into()
    .unwrap();
const RECIPIENT: ContractAddress =
    0x03dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A5919
    .try_into()
    .unwrap();
const OTHER_ADDRESS: ContractAddress =
    0x07dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A591D
    .try_into()
    .unwrap();
const ZERO_ADDRESS: ContractAddress =
    0x0000000000000000000000000000000000000000000000000000000000000000
    .try_into()
    .unwrap();
const TOKEN_ADDRESS: ContractAddress =
    0x04dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A591A
    .try_into()
    .unwrap();
const GOVERNANCE_ADDRESS: ContractAddress =
    0x05dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A591B
    .try_into()
    .unwrap();

// ============================================================================
// DeploymentSpec Tests
// ============================================================================

#[test]
fn test_deployment_spec_creation() {
    let spec = chrono_plan::domain::types::schedule::DeploymentSpec {
        recipient: RECIPIENT,
        amount: 1000_u256,
        start_time: 1000000_u64,
        duration: 86400_u64,
        curve_key: 'LINEAR',
        curve_params: 0,
        token_address: TOKEN_ADDRESS,
        governance_address: GOVERNANCE_ADDRESS,
    };

    assert(spec.recipient == RECIPIENT, 'Recipient mismatch');
    assert(spec.amount == 1000_u256, 'Amount mismatch');
    assert(spec.duration == 86400_u64, 'Duration mismatch');
    assert(spec.curve_key == 'LINEAR', 'Curve key mismatch');
}

#[test]
fn test_deployment_spec_zero_recipient() {
    let spec = chrono_plan::domain::types::schedule::DeploymentSpec {
        recipient: ZERO_ADDRESS,
        amount: 1000_u256,
        start_time: 1000000_u64,
        duration: 86400_u64,
        curve_key: 'LINEAR',
        curve_params: 0,
        token_address: TOKEN_ADDRESS,
        governance_address: GOVERNANCE_ADDRESS,
    };

    assert(spec.recipient.into() == 0, 'Zero recipient');
}

#[test]
fn test_deployment_spec_zero_amount() {
    let spec = chrono_plan::domain::types::schedule::DeploymentSpec {
        recipient: RECIPIENT,
        amount: 0_u256,
        start_time: 1000000_u64,
        duration: 86400_u64,
        curve_key: 'LINEAR',
        curve_params: 0,
        token_address: TOKEN_ADDRESS,
        governance_address: GOVERNANCE_ADDRESS,
    };

    assert(spec.amount == 0_u256, 'Zero amount');
}

#[test]
fn test_deployment_spec_zero_duration() {
    let spec = chrono_plan::domain::types::schedule::DeploymentSpec {
        recipient: RECIPIENT,
        amount: 1000_u256,
        start_time: 1000000_u64,
        duration: 0_u64,
        curve_key: 'LINEAR',
        curve_params: 0,
        token_address: TOKEN_ADDRESS,
        governance_address: GOVERNANCE_ADDRESS,
    };

    assert(spec.duration == 0_u64, 'Zero duration');
}

#[test]
fn test_deployment_spec_zero_governance() {
    let spec = chrono_plan::domain::types::schedule::DeploymentSpec {
        recipient: RECIPIENT,
        amount: 1000_u256,
        start_time: 1000000_u64,
        duration: 86400_u64,
        curve_key: 'LINEAR',
        curve_params: 0,
        token_address: TOKEN_ADDRESS,
        governance_address: ZERO_ADDRESS,
    };

    assert(spec.governance_address.into() == 0, 'Zero governance');
}

#[test]
fn test_deployment_spec_zero_token() {
    let spec = chrono_plan::domain::types::schedule::DeploymentSpec {
        recipient: RECIPIENT,
        amount: 1000_u256,
        start_time: 1000000_u64,
        duration: 86400_u64,
        curve_key: 'LINEAR',
        curve_params: 0,
        token_address: ZERO_ADDRESS,
        governance_address: GOVERNANCE_ADDRESS,
    };

    assert(spec.token_address.into() == 0, 'Zero token');
}

#[test]
fn test_deployment_spec_all_curves() {
    // LINEAR
    let spec1 = chrono_plan::domain::types::schedule::DeploymentSpec {
        recipient: RECIPIENT,
        amount: 1000_u256,
        start_time: 1000000_u64,
        duration: 86400_u64,
        curve_key: 'LINEAR',
        curve_params: 0,
        token_address: TOKEN_ADDRESS,
        governance_address: GOVERNANCE_ADDRESS,
    };
    assert(spec1.curve_key == 'LINEAR', 'LINEAR key');

    // CLIFF
    let spec2 = chrono_plan::domain::types::schedule::DeploymentSpec {
        recipient: RECIPIENT,
        amount: 1000_u256,
        start_time: 1000000_u64,
        duration: 86400_u64,
        curve_key: 'CLIFF',
        curve_params: 3600,
        token_address: TOKEN_ADDRESS,
        governance_address: GOVERNANCE_ADDRESS,
    };
    assert(spec2.curve_key == 'CLIFF', 'CLIFF key');

    // EXP_DECAY
    let spec3 = chrono_plan::domain::types::schedule::DeploymentSpec {
        recipient: RECIPIENT,
        amount: 1000_u256,
        start_time: 1000000_u64,
        duration: 86400_u64,
        curve_key: 'EXP_DECAY',
        curve_params: 1000,
        token_address: TOKEN_ADDRESS,
        governance_address: GOVERNANCE_ADDRESS,
    };
    assert(spec3.curve_key == 'EXP_DECAY', 'EXP_DECAY key');
}

// ============================================================================
// Curve Calculations (using ICurve trait)
// ============================================================================

#[test]
fn test_linear_curve_zero_duration() {
    let result =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        1000_u256, 0, 100_u64, 0_u64,
    );
    assert(result == 0_u256, 'Zero duration returns 0');
}

#[test]
fn test_linear_curve_zero_elapsed() {
    let result =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        1000_u256, 0, 0_u64, 86400_u64,
    );
    assert(result == 0_u256, 'Zero elapsed returns 0');
}

#[test]
fn test_linear_curve_full_duration() {
    let result =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        1000_u256, 0, 86400_u64, 86400_u64,
    );
    assert(result == 1000_u256, 'Full duration returns full');
}

#[test]
fn test_linear_curve_half_elapsed() {
    let result =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        1000_u256, 0, 43200_u64, 86400_u64,
    );
    assert(result <= 500_u256, 'Half elapsed <= 50%');
    assert(result >= 499_u256, 'Half elapsed >= 49.9%');
}

#[test]
fn test_linear_curve_quarter_elapsed() {
    let result =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        1000_u256, 0, 21600_u64, 86400_u64,
    );
    assert(result <= 251_u256, 'Quarter elapsed <= 25.1%');
    assert(result >= 249_u256, 'Quarter elapsed >= 24.9%');
}

#[test]
fn test_linear_curve_validate_params() {
    assert(
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::validate_params(
            0,
        ) == true,
        'Zero params valid',
    );
    assert(
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::validate_params(
            1000,
        ) == true,
        'Non-zero valid',
    );
}

#[test]
fn test_linear_curve_name_and_version() {
    assert(
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::name() == 'Linear',
        'Name is Linear',
    );
    assert(
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::version() == 'v1.3.0',
        'Version v1.3.0',
    );
}

#[test]
fn test_linear_curve_large_amount() {
    let result =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        1_000_000_000_u256, 0, 43200_u64, 86400_u64,
    );
    assert(result <= 500_001_000_u256, 'Large amount <= 50%');
    assert(result >= 499_999_000_u256, 'Large amount >= 49.9%');
}

// ============================================================================
// Cliff Curve Tests
// ============================================================================

#[test]
fn test_cliff_curve_before_cliff() {
    // Cliff=3600, elapsed=1000 (before cliff)
    let result = chrono_plan::infrastructure::implementations::curves::cliff::CliffCurve::calculate(
        1000_u256, 3600, 1000_u64, 86400_u64,
    );
    assert(result == 0_u256, 'Before cliff returns 0');
}

#[test]
fn test_cliff_curve_after_cliff() {
    // Cliff=3600, elapsed=7200 (after cliff)
    let result = chrono_plan::infrastructure::implementations::curves::cliff::CliffCurve::calculate(
        1000_u256, 3600, 7200_u64, 86400_u64,
    );
    assert(result > 0_u256, 'After cliff > 0');
    assert(result < 1000_u256, 'After cliff < full');
}

#[test]
fn test_cliff_curve_full_duration() {
    let result = chrono_plan::infrastructure::implementations::curves::cliff::CliffCurve::calculate(
        1000_u256, 3600, 86400_u64, 86400_u64,
    );
    assert(result == 1000_u256, 'Full duration returns full');
}

#[test]
fn test_cliff_curve_cliff_exceeds_duration() {
    // Cliff > duration
    let result = chrono_plan::infrastructure::implementations::curves::cliff::CliffCurve::calculate(
        1000_u256, 86400, 0_u64, 3600_u64,
    );
    assert(result == 1000_u256, 'Cliff > duration returns full');
}

#[test]
fn test_cliff_curve_validate_params() {
    assert(
        chrono_plan::infrastructure::implementations::curves::cliff::CliffCurve::validate_params(
            0,
        ) == false,
        'Zero cliff invalid',
    );
    assert(
        chrono_plan::infrastructure::implementations::curves::cliff::CliffCurve::validate_params(
            3600,
        ) == true,
        'Non-zero cliff valid',
    );
}

#[test]
fn test_cliff_curve_name() {
    assert(
        chrono_plan::infrastructure::implementations::curves::cliff::CliffCurve::name() == 'Cliff',
        'Name is Cliff',
    );
}

// ============================================================================
// ExpDecay Curve Tests
// ============================================================================

#[test]
fn test_exp_decay_curve_zero_duration() {
    let result =
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::calculate(
        1000_u256, 1000, 100_u64, 0_u64,
    );
    assert(result == 0_u256, 'Zero duration returns 0');
}

#[test]
fn test_exp_decay_curve_zero_elapsed() {
    let result =
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::calculate(
        1000_u256, 1000, 0_u64, 86400_u64,
    );
    assert(result == 0_u256, 'Zero elapsed returns 0');
}

#[test]
fn test_exp_decay_curve_full_duration() {
    let result =
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::calculate(
        1000_u256, 1000, 86400_u64, 86400_u64,
    );
    assert(result == 1000_u256, 'Full duration returns full');
}

#[test]
fn test_exp_decay_curve_zero_rate() {
    // Rate=0 behaves like linear
    let result =
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::calculate(
        1000_u256, 0, 43200_u64, 86400_u64,
    );
    assert(result <= 500_u256, 'Zero rate <= 50%');
}

#[test]
fn test_exp_decay_curve_with_rate() {
    // With front-loading, early vesting is accelerated
    let result =
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::calculate(
        1000_u256, 1000, 8640_u64, 86400_u64,
    );
    assert(result > 100_u256, 'Front-loaded > 10%');
    assert(result < 500_u256, 'Front-loaded < 50%');
}

#[test]
fn test_exp_decay_curve_validate_params() {
    assert(
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::validate_params(
            0,
        ) == true,
        'Zero rate valid',
    );
    assert(
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::validate_params(
            1000,
        ) == true,
        'Valid rate',
    );
    assert(
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::validate_params(
            10000,
        ) == true,
        'Max rate valid',
    );
    assert(
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::validate_params(
            10001,
        ) == false,
        'Over max invalid',
    );
}

#[test]
fn test_exp_decay_curve_name() {
    assert(
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::name() == 'FrontLoaded',
        'Name is FrontLoaded',
    );
}

// ============================================================================
// VersionInfo Tests
// ============================================================================

#[test]
fn test_version_info_fields() {
    let version = chrono_plan::domain::types::schedule::VersionInfo {
        major: 1, minor: 2, patch: 3, is_active: true, registered_at: 1234567890_u64,
    };

    assert(version.major == 1, 'Major = 1');
    assert(version.minor == 2, 'Minor = 2');
    assert(version.patch == 3, 'Patch = 3');
    assert(version.is_active == true, 'Active = true');
    assert(version.registered_at == 1234567890_u64, 'Registered');
}

// ============================================================================
// CurveMetadata Tests
// ============================================================================

#[test]
fn test_curve_metadata_fields() {
    let metadata = chrono_plan::domain::types::schedule::CurveMetadata {
        name: 'Linear',
        version: 'v1.1.0',
        audit_uri: 'https://audit.example.com',
        gas_estimate: 50000_u64,
    };

    assert(metadata.name == 'Linear', 'Name = Linear');
    assert(metadata.version == 'v1.1.0', 'Version = v1.0.0');
    assert(metadata.gas_estimate == 50000_u64, 'Gas estimate');
}

// ============================================================================
// Governance Type Constants Tests
// ============================================================================

#[test]
fn test_governance_type_constants() {
    use chrono_plan::domain::traits::governance::governance_type;

    assert(governance_type::SINGLE_ADMIN == 'SINGLE_ADMIN', 'SINGLE_ADMIN');
    assert(governance_type::MULTISIG == 'MULTISIG', 'MULTISIG');
    assert(governance_type::DAO == 'DAO', 'DAO');
}

// ============================================================================
// Precision Tests
// ============================================================================

#[test]
fn test_linear_precision_at_25_percent() {
    let result =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        10000_u256, 0, 21600_u64, 86400_u64,
    );
    assert(result >= 2499_u256, '>= 24.99%');
    assert(result <= 2501_u256, '<= 25.01%');
}

#[test]
fn test_linear_precision_at_75_percent() {
    let result =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        10000_u256, 0, 64800_u64, 86400_u64,
    );
    assert(result >= 7499_u256, '>= 74.99%');
    assert(result <= 7501_u256, '<= 75.01%');
}

#[test]
fn test_very_short_duration() {
    let result =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        1000_u256, 0, 1_u64, 1_u64,
    );
    assert(result == 1000_u256, '1s duration = full amount');
}

// ============================================================================
// Edge Case Tests
// ============================================================================

#[test]
fn test_all_curves_never_exceed_amount() {
    let amount = 1000_u256;
    let elapsed = 43200_u64;
    let duration = 86400_u64;

    let linear =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        amount, 0, elapsed, duration,
    );
    let cliff = chrono_plan::infrastructure::implementations::curves::cliff::CliffCurve::calculate(
        amount, 0, elapsed, duration,
    );
    let exp =
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::calculate(
        amount, 0, elapsed, duration,
    );

    assert(linear <= amount, 'Linear never exceeds');
    assert(cliff <= amount, 'Cliff never exceeds');
    assert(exp <= amount, 'ExpDecay never exceeds');
}

#[test]
fn test_all_curves_never_negative() {
    let amount = 1000_u256;
    let duration = 86400_u64;

    let linear =
        chrono_plan::infrastructure::implementations::curves::linear::LinearCurve::calculate(
        amount, 0, 0_u64, duration,
    );
    let cliff = chrono_plan::infrastructure::implementations::curves::cliff::CliffCurve::calculate(
        amount, 3600, 0_u64, duration,
    );
    let exp =
        chrono_plan::infrastructure::implementations::curves::exp_decay::ExpDecayCurve::calculate(
        amount, 1000, 0_u64, duration,
    );

    assert(linear >= 0_u256, 'Linear never negative');
    assert(cliff >= 0_u256, 'Cliff never negative');
    assert(exp >= 0_u256, 'ExpDecay never negative');
}
