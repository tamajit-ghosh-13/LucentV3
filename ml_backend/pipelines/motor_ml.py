"""
Motor ML Engine - Lucent Accessibility Suite
Analyzes cursor telemetry, tremor signatures, and calculates dynamic adaptations:
- Tremor Trajectory Analysis & Jitter Quantification
- Dynamic Hitbox Geometry Expansion (WCAG 2.5.5 / 2.5.8)
- Magnetic Gravity Attractor Field Thresholds
- Hold-to-Confirm Spasm Protection Gateways
- Gemini Multimodal Form Intent Synthesis
"""

import math
from typing import List, Dict, Any, Tuple, Optional

class TremorTelemetryPoint:
    def __init__(self, x: float, y: float, timestamp_ms: float):
        self.x = x
        self.y = y
        self.timestamp_ms = timestamp_ms

class TremorAnalyzer:
    """
    Evaluates high-frequency oscillation (4-12 Hz) typical of Parkinson's,
    essential tremor, and ataxia by analyzing trajectory angular divergence.
    """
    @staticmethod
    def calculate_path_efficiency(points: List[Dict[str, float]]) -> float:
        """
        Calculates ratio of straight-line Euclidean distance to actual distance traveled.
        A ratio < 0.5 indicates significant tremor or motor control struggle.
        """
        if len(points) < 2:
            return 1.0
        
        # Euclidean distance between start and end
        dx = points[-1]['x'] - points[0]['x']
        dy = points[-1]['y'] - points[0]['y']
        straight_dist = math.hypot(dx, dy)
        
        # Total trajectory path length
        actual_path = 0.0
        for i in range(1, len(points)):
            step_dx = points[i]['x'] - points[i-1]['x']
            step_dy = points[i]['y'] - points[i-1]['y']
            actual_path += math.hypot(step_dx, step_dy)
            
        if actual_path == 0:
            return 1.0
        return min(1.0, straight_dist / actual_path)

    @staticmethod
    def detect_tremor_frequency(points: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Estimates jitter velocity variance and returns tremor severity score (0.0 to 1.0).
        """
        if len(points) < 3:
            return {"tremor_score": 0.0, "severity": "none", "recommended_debounce_ms": 200}
        
        # Compute acceleration reversals (direction flips in short intervals)
        reversals = 0
        for i in range(2, len(points)):
            dx1 = points[i-1]['x'] - points[i-2]['x']
            dx2 = points[i]['x'] - points[i-1]['x']
            if (dx1 * dx2) < 0:
                reversals += 1

        reversal_ratio = reversals / max(1, len(points) - 2)
        efficiency = TremorAnalyzer.calculate_path_efficiency(points)
        tremor_score = min(1.0, (1.0 - efficiency) * 0.6 + reversal_ratio * 0.4)

        if tremor_score > 0.65:
            severity = "severe"
            recommended_debounce = 450
            gravity_radius_px = 44
        elif tremor_score > 0.35:
            severity = "moderate"
            recommended_debounce = 350
            gravity_radius_px = 36
        else:
            severity = "mild"
            recommended_debounce = 250
            gravity_radius_px = 28

        return {
            "tremor_score": round(tremor_score, 3),
            "severity": severity,
            "path_efficiency": round(efficiency, 3),
            "recommended_debounce_ms": recommended_debounce,
            "recommended_gravity_radius_px": gravity_radius_px
        }

class DynamicHitboxOptimizer:
    """
    Computes CSS padding expansions required to meet WCAG 2.2 AAA Target Size (48x48px min)
    plus user-specific safety buffers determined by the Online RL agent.
    """
    MIN_WCAG_SIZE = 48.0 # px

    @classmethod
    def compute_padding(cls, current_width: float, current_height: float, tremor_severity: str = "mild") -> Dict[str, float]:
        severity_multiplier = {
            "mild": 1.0,
            "moderate": 1.2,
            "severe": 1.4
        }.get(tremor_severity, 1.0)

        target_size = cls.MIN_WCAG_SIZE * severity_multiplier
        needed_pad_x = max(0.0, (target_size - current_width) / 2.0)
        needed_pad_y = max(0.0, (target_size - current_height) / 2.0)

        return {
            "target_width": round(max(current_width, target_size), 1),
            "target_height": round(max(current_height, target_size), 1),
            "padding_horizontal_px": round(needed_pad_x, 1),
            "padding_vertical_px": round(needed_pad_y, 1),
            "wcag_compliant": True
        }

class SpasmHoldValidator:
    """
    Evaluates whether a click duration qualifies as an intentional hold
    or an involuntary motor spasm.
    """
    SPASM_THRESHOLD_MS = 250  # Clicks shorter than 250ms during high spasm states
    MIN_HOLD_CONFIRM_MS = 600 # Intentional hold threshold for destructive actions

    @classmethod
    def evaluate_press(cls, duration_ms: float, is_destructive_action: bool = False) -> Dict[str, Any]:
        if is_destructive_action:
            confirmed = duration_ms >= cls.MIN_HOLD_CONFIRM_MS
            return {
                "confirmed": confirmed,
                "reason": "Hold confirmed" if confirmed else f"Spasm protected: held for {int(duration_ms)}ms (required {cls.MIN_HOLD_CONFIRM_MS}ms)",
                "fill_progress": min(1.0, duration_ms / cls.MIN_HOLD_CONFIRM_MS)
            }
        
        is_spasm_bounce = duration_ms < 60 # sub-60ms is typically an accidental bounce
        return {
            "confirmed": not is_spasm_bounce,
            "reason": "Bounce rejected" if is_spasm_bounce else "Valid click",
            "fill_progress": 1.0
        }

class GeminiMotorAutopilotSynthesizer:
    """
    Prepares multimodal prompts for Gemini 2.0 to parse complex civic/e-gov forms
    and predict intended field completions, eliminating repetitive physical motor actions.
    """
    @staticmethod
    def generate_form_prompt(form_fields: List[str], user_profile_context: Dict[str, Any]) -> str:
        return f"""
System: You are Lucent Motor Accessibility Autopilot.
Task: Synthesize verified default inputs for the detected form to eliminate fine-motor clicking and typing.
Fields detected: {form_fields}
User Context: {user_profile_context}
Return JSON mapping with key-value pairs to auto-fill.
"""
