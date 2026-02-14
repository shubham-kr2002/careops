"""
AI Service Layer - Groq Llama 3.2 Integration
Provides AI-powered features: intent recognition, sentiment analysis, demand forecasting, staff routing
"""
import os
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from groq import Groq
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Confidence threshold per .clinerules Rule #4
CONFIDENCE_THRESHOLD = 0.75


class InquiryContext(BaseModel):
    """Context for customer inquiry processing"""
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    previous_conversation: Optional[List[str]] = None
    workspace_services: Optional[List[str]] = None
    booking_history: Optional[int] = 0


class InquiryResult(BaseModel):
    """Result of AI inquiry processing"""
    intent: str = Field(description="Detected intent: booking, question, complaint, cancellation, feedback, unknown")
    sentiment: str = Field(description="Sentiment: positive, neutral, negative")
    confidence: float = Field(description="Confidence score 0-1")
    suggested_response: Optional[str] = None
    method: str = Field(description="AI method used: ai or rule-based")
    fallback_used: bool = Field(description="Whether fallback was used")
    explanation: Optional[str] = None


class DemandForecastInput(BaseModel):
    """Input for demand forecasting"""
    historical_data: List[Dict[str, Any]] = Field(description="List of {date, count} entries")
    days_to_forecast: int = Field(default=7, ge=1, le=30)


class DemandForecastResult(BaseModel):
    """Result of demand forecasting"""
    forecast: List[Dict[str, Any]] = Field(description="List of {date, predicted_count, confidence}")
    method: str
    confidence: float
    fallback_used: bool


class StaffRoutingInput(BaseModel):
    """Input for staff routing decision"""
    inquiry_intent: str
    inquiry_subject: str
    required_skills: List[str]
    staff_members: List[Dict[str, Any]]  # {id, name, skills, available}


class StaffRoutingResult(BaseModel):
    """Result of staff routing"""
    recommended_staff_id: Optional[str]
    reasoning: str
    confidence: float
    fallback_used: bool
    method: str


class AIService:
    """AI Service with Groq Llama 3.2 and rule-based fallback"""
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            self.groq_client = Groq(api_key=api_key)
            self.model = "llama-3.3-70b-versatile"
            self.available = True
            logger.info("AI Service initialized with Groq Llama 3.2")
        else:
            self.groq_client = None
            self.available = False
            logger.warning("GROQ_API_KEY not set, AI service unavailable")
    
    async def process_inquiry(
        self, 
        inquiry: str, 
        context: Optional[InquiryContext] = None
    ) -> InquiryResult:
        """Process customer inquiry with AI, fallback to rules if needed"""
        
        if not self.available:
            return self._rule_based_inquiry(inquiry, context, error="AI service unavailable")
        
        context_str = ""
        if context:
            ctx_parts = []
            if context.contact_name:
                ctx_parts.append(f"Customer: {context.contact_name}")
            if context.previous_conversation:
                ctx_parts.append(f"Recent: {context.previous_conversation[-3:]}")
            if context.workspace_services:
                ctx_parts.append(f"Services: {', '.join(context.workspace_services)}")
            context_str = "\n".join(ctx_parts)
        
        prompt = f"""Analyze this customer inquiry and provide JSON output:
Inquiry: {inquiry}
Context: {context_str}

Provide ONLY valid JSON (no markdown):
{{
  "intent": "booking|question|complaint|cancellation|feedback|unknown",
  "sentiment": "positive|neutral|negative",
  "confidence": 0.0-1.0,
  "suggested_response": "brief response text or null"
}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Check confidence threshold per Rule #4
            confidence = float(result.get("confidence", 0.0))
            if confidence < CONFIDENCE_THRESHOLD:
                logger.info(f"AI confidence {confidence} below threshold {CONFIDENCE_THRESHOLD}, using fallback")
                return self._rule_based_inquiry(inquiry, context, ai_result=result)
            
            return InquiryResult(
                intent=result.get("intent", "unknown"),
                sentiment=result.get("sentiment", "neutral"),
                confidence=confidence,
                suggested_response=result.get("suggested_response"),
                method="ai",
                fallback_used=False,
                explanation=f"AI processed with confidence {confidence}"
            )
            
        except Exception as e:
            logger.error(f"AI inquiry processing failed: {e}")
            return self._rule_based_inquiry(inquiry, context, error=str(e))
    
    def _rule_based_inquiry(
        self, 
        inquiry: str, 
        context: Optional[InquiryContext] = None,
        ai_result: Optional[Dict] = None,
        error: Optional[str] = None
    ) -> InquiryResult:
        """Rule-based fallback for inquiry processing"""
        
        inquiry_lower = inquiry.lower()
        
        # Simple keyword-based intent detection
        intents = {
            "booking": ["book", "appointment", "schedule", "reserve", "availability"],
            "cancellation": ["cancel", "reschedule", "change", "not coming"],
            "complaint": ["problem", "issue", "wrong", "bad", "terrible", "complaint"],
            "question": ["how", "what", "when", "where", "why", "can i", "do you"],
            "feedback": ["thank", "great", "love", "amazing", "wonderful", "feedback"]
        }
        
        detected_intent = "unknown"
        for intent, keywords in intents.items():
            if any(kw in inquiry_lower for kw in keywords):
                detected_intent = intent
                break
        
        # Simple sentiment detection
        positive_words = ["thank", "great", "love", "amazing", "wonderful", "excellent"]
        negative_words = ["problem", "issue", "wrong", "bad", "terrible", "hate", "worst", "complaint"]
        
        sentiment = "neutral"
        if any(w in inquiry_lower for w in positive_words):
            sentiment = "positive"
        elif any(w in inquiry_lower for w in negative_words):
            sentiment = "negative"
        
        # Generate simple response
        responses = {
            "booking": "I'd be happy to help you book an appointment. Could you let me know which service you're interested in?",
            "cancellation": "I understand you need to cancel or change your booking. Let me look into that for you.",
            "complaint": "I'm sorry to hear about this issue. Let me make this right for you.",
            "question": "I'd be happy to answer your question. What would you like to know?",
            "feedback": "Thank you for your feedback! We really appreciate it.",
            "unknown": "Thank you for reaching out. How can I help you today?"
        }
        
        return InquiryResult(
            intent=detected_intent,
            sentiment=sentiment,
            confidence=1.0,  # Rule-based is certain
            suggested_response=responses.get(detected_intent, responses["unknown"]),
            method="rule-based",
            fallback_used=True,
            explanation=f"Fallback used. AI confidence below threshold or error: {error or 'low confidence'}"
        )
    
    async def predict_demand(
        self, 
        input_data: DemandForecastInput
    ) -> DemandForecastResult:
        """Predict booking demand using historical data"""
        
        if not self.available:
            return self._rule_based_demand(input_data)
        
        # Prepare historical data summary
        hist_summary = []
        for entry in input_data.historical_data[-14:]:  # Last 2 weeks
            hist_summary.append(f"{entry.get('date', '')}: {entry.get('count', 0)}")
        
        prompt = f"""Based on this historical booking data, predict demand for the next {input_data.days_to_forecast} days.
Historical data (last 14 days):
{chr(10).join(hist_summary)}

Provide ONLY valid JSON array (no markdown):
[
  {{"date": "YYYY-MM-DD", "predicted_count": number, "confidence": 0.0-1.0}},
  ...
]"""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=300,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Ensure it's a list
            if isinstance(result, dict) and "forecast" in result:
                forecast = result["forecast"]
            elif isinstance(result, list):
                forecast = result
            else:
                forecast = []
            
            avg_confidence = sum(f.get("confidence", 0.75) for f in forecast) / len(forecast) if forecast else 0.75
            
            return DemandForecastResult(
                forecast=forecast,
                method="ai",
                confidence=avg_confidence,
                fallback_used=False
            )
            
        except Exception as e:
            logger.error(f"AI demand forecasting failed: {e}")
            return self._rule_based_demand(input_data)
    
    def _rule_based_demand(self, input_data: DemandForecastInput) -> DemandForecastResult:
        """Simple rule-based demand forecasting"""
        
        if not input_data.historical_data:
            # No data, return simple estimate
            return DemandForecastResult(
                forecast=[
                    {"date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"), "predicted_count": 5, "confidence": 1.0}
                    for i in range(input_data.days_to_forecast)
                ],
                method="rule-based",
                confidence=1.0,
                fallback_used=True
            )
        
        # Simple average-based prediction
        counts = [d.get("count", 0) for d in input_data.historical_data]
        avg_count = sum(counts) / len(counts) if counts else 5
        
        forecast = []
        for i in range(input_data.days_to_forecast):
            date = datetime.now() + timedelta(days=i+1)
            forecast.append({
                "date": date.strftime("%Y-%m-%d"),
                "predicted_count": int(avg_count),
                "confidence": 1.0
            })
        
        return DemandForecastResult(
            forecast=forecast,
            method="rule-based",
            confidence=1.0,
            fallback_used=True
        )
    
    async def route_to_staff(
        self, 
        input_data: StaffRoutingInput
    ) -> StaffRoutingResult:
        """Route inquiry to appropriate staff based on skills"""
        
        if not input_data.staff_members:
            return StaffRoutingResult(
                recommended_staff_id=None,
                reasoning="No staff members available",
                confidence=1.0,
                fallback_used=True,
                method="rule-based"
            )
        
        if not self.available:
            return self._rule_based_routing(input_data)
        
        # Build staff skills summary
        staff_summary = []
        for staff in input_data.staff_members:
            skills = ", ".join(staff.get("skills", []))
            available = "available" if staff.get("available", True) else "unavailable"
            staff_summary.append(f"Staff {staff.get('name')}: skills={skills}, {available}")
        
        prompt = f"""Given this inquiry:
- Intent: {input_data.inquiry_intent}
- Subject: {input_data.inquiry_subject}
- Required skills: {', '.join(input_data.required_skills)}

Available staff:
{chr(10).join(staff_summary)}

Recommend the best staff member and provide reasoning. 
Provide ONLY valid JSON:
{{"staff_id": "staff-id-or-null", "reasoning": "brief explanation", "confidence": 0.0-1.0}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=200,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return StaffRoutingResult(
                recommended_staff_id=result.get("staff_id"),
                reasoning=result.get("reasoning", "AI recommended"),
                confidence=float(result.get("confidence", 0.75)),
                fallback_used=False,
                method="ai"
            )
            
        except Exception as e:
            logger.error(f"AI staff routing failed: {e}")
            return self._rule_based_routing(input_data)
    
    def _rule_based_routing(self, input_data: StaffRoutingInput) -> StaffRoutingResult:
        """Simple rule-based staff routing"""
        
        # Find staff with matching skills
        available_staff = [s for s in input_data.staff_members if s.get("available", True)]
        
        if not available_staff:
            return StaffRoutingResult(
                recommended_staff_id=None,
                reasoning="No available staff",
                confidence=1.0,
                fallback_used=True,
                method="rule-based"
            )
        
        # Simple skill matching
        for staff in available_staff:
            staff_skills = set(s.get("skills", []))
            required = set(input_data.required_skills)
            if staff_skills & required:  # Has at least one matching skill
                return StaffRoutingResult(
                    recommended_staff_id=staff.get("id"),
                    reasoning=f"Staff {staff.get('name')} has matching skills",
                    confidence=1.0,
                    fallback_used=True,
                    method="rule-based"
                )
        
        # No match, return first available
        return StaffRoutingResult(
            recommended_staff_id=available_staff[0].get("id"),
            reasoning=f"No skill match, assigned to {available_staff[0].get('name')}",
            confidence=1.0,
            fallback_used=True,
            method="rule-based"
        )

    # ─── Translation ─────────────────────────────────────────────────────────
    async def translate_text(
        self, text: str, target_language: str, source_language: str = "auto"
    ) -> Dict[str, Any]:
        """Translate text to target language via AI."""
        if not self.available:
            return {
                "translated_text": text,
                "source_language": source_language,
                "target_language": target_language,
                "method": "rule-based",
                "fallback_used": True,
                "note": "AI unavailable, returning original text",
            }

        prompt = f"""Translate the following text to {target_language}.
Source language: {source_language}
Text: {text}

Provide ONLY valid JSON:
{{"translated_text": "...", "source_language": "detected-language-code", "confidence": 0.0-1.0}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1000,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            return {
                "translated_text": result.get("translated_text", text),
                "source_language": result.get("source_language", source_language),
                "target_language": target_language,
                "confidence": float(result.get("confidence", 0.8)),
                "method": "ai",
                "fallback_used": False,
            }
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return {
                "translated_text": text,
                "source_language": source_language,
                "target_language": target_language,
                "method": "rule-based",
                "fallback_used": True,
                "error": str(e),
            }

    # ─── Language Detection ──────────────────────────────────────────────────
    async def detect_language(self, text: str) -> Dict[str, Any]:
        """Detect the language of a text."""
        if not self.available:
            return self._rule_based_language_detection(text)

        prompt = f"""Detect the language of this text: "{text}"

Provide ONLY valid JSON:
{{"language_code": "en", "language_name": "English", "confidence": 0.0-1.0}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=100,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            return {
                "language_code": result.get("language_code", "en"),
                "language_name": result.get("language_name", "English"),
                "confidence": float(result.get("confidence", 0.8)),
                "method": "ai",
                "fallback_used": False,
            }
        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            return self._rule_based_language_detection(text)

    def _rule_based_language_detection(self, text: str) -> Dict[str, Any]:
        """Fallback language detection using common word patterns."""
        text_lower = text.lower()
        lang_patterns = {
            "es": ["hola", "gracias", "por favor", "buenos", "cómo", "está"],
            "fr": ["bonjour", "merci", "s'il vous", "comment", "oui", "non"],
            "de": ["hallo", "danke", "bitte", "wie", "gut", "ich"],
            "hi": ["नमस्ते", "धन्यवाद", "कृपया", "है", "हैं", "का"],
            "pt": ["olá", "obrigado", "por favor", "como", "bom", "dia"],
        }
        for code, words in lang_patterns.items():
            if any(w in text_lower for w in words):
                return {
                    "language_code": code,
                    "language_name": code.upper(),
                    "confidence": 1.0,
                    "method": "rule-based",
                    "fallback_used": True,
                }
        return {
            "language_code": "en",
            "language_name": "English",
            "confidence": 1.0,
            "method": "rule-based",
            "fallback_used": True,
        }

    # ─── Contact Segmentation ────────────────────────────────────────────────
    async def segment_contact(self, activity_data: Dict[str, Any]) -> Dict[str, Any]:
        """AI-powered contact segmentation based on activity patterns."""
        if not self.available:
            return self._rule_based_segmentation(activity_data)

        prompt = f"""Segment this customer based on their activity data:
- Total bookings: {activity_data.get('total_bookings', 0)}
- Lifetime value: ${activity_data.get('lifetime_value', 0):.2f}
- Last activity: {activity_data.get('last_activity', 'never')}
- Contact since: {activity_data.get('created_at', 'unknown')}
- Average booking frequency: {activity_data.get('avg_frequency', 'unknown')}

Provide ONLY valid JSON:
{{"segment": "vip|regular|occasional|at-risk|new|inactive", "confidence": 0.0-1.0, "reasoning": "brief explanation", "recommended_actions": ["action1", "action2"]}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=300,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            confidence = float(result.get("confidence", 0.0))
            if confidence < CONFIDENCE_THRESHOLD:
                return self._rule_based_segmentation(activity_data)
            return {
                "segment": result.get("segment", "regular"),
                "confidence": confidence,
                "reasoning": result.get("reasoning", ""),
                "recommended_actions": result.get("recommended_actions", []),
                "method": "ai",
                "fallback_used": False,
            }
        except Exception as e:
            logger.error(f"AI segmentation failed: {e}")
            return self._rule_based_segmentation(activity_data)

    def _rule_based_segmentation(self, activity_data: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based contact segmentation."""
        total_bookings = activity_data.get("total_bookings", 0)
        lifetime_value = activity_data.get("lifetime_value", 0)

        if total_bookings >= 20 or lifetime_value >= 5000:
            segment = "vip"
            actions = ["Send VIP perks", "Priority support"]
        elif total_bookings >= 10:
            segment = "regular"
            actions = ["Loyalty discount", "Referral program"]
        elif total_bookings >= 3:
            segment = "occasional"
            actions = ["Re-engagement campaign", "Special offer"]
        elif total_bookings == 0:
            segment = "new"
            actions = ["Welcome email", "First-time discount"]
        else:
            segment = "at-risk"
            actions = ["Win-back campaign", "Feedback survey"]

        return {
            "segment": segment,
            "confidence": 1.0,
            "reasoning": f"Based on {total_bookings} bookings, ${lifetime_value:.2f} lifetime value",
            "recommended_actions": actions,
            "method": "rule-based",
            "fallback_used": True,
        }

    # ─── Maintenance Prediction ──────────────────────────────────────────────
    async def predict_maintenance(self, equipment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict equipment maintenance needs using AI."""
        if not self.available:
            return self._rule_based_maintenance(equipment_data)

        prompt = f"""Predict maintenance needs for this equipment:
- Name: {equipment_data.get('name')}
- Type: {equipment_data.get('type')}
- Last maintained: {equipment_data.get('last_maintained')}
- Maintenance interval: {equipment_data.get('interval_days')} days
- Usage count: {equipment_data.get('usage_count', 0)}
- Current status: {equipment_data.get('status')}
- Age (days): {equipment_data.get('age_days', 0)}

Provide ONLY valid JSON:
{{"risk_level": "low|medium|high|critical", "days_until_due": number, "confidence": 0.0-1.0, "recommendation": "brief recommendation", "estimated_cost": number_or_null}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=300,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            return {
                "risk_level": result.get("risk_level", "medium"),
                "days_until_due": result.get("days_until_due", 30),
                "confidence": float(result.get("confidence", 0.75)),
                "recommendation": result.get("recommendation", ""),
                "estimated_cost": result.get("estimated_cost"),
                "method": "ai",
                "fallback_used": False,
            }
        except Exception as e:
            logger.error(f"AI maintenance prediction failed: {e}")
            return self._rule_based_maintenance(equipment_data)

    def _rule_based_maintenance(self, equipment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based maintenance prediction."""
        interval = equipment_data.get("interval_days", 90)
        last_maintained = equipment_data.get("last_maintained")
        usage = equipment_data.get("usage_count", 0)

        if last_maintained:
            try:
                last_date = datetime.fromisoformat(str(last_maintained).replace("Z", "+00:00"))
                days_since = (datetime.now() - last_date.replace(tzinfo=None)).days
            except (ValueError, TypeError):
                days_since = interval
        else:
            days_since = interval * 2  # Never maintained = overdue

        days_until = max(0, interval - days_since)
        overdue_ratio = days_since / interval if interval > 0 else 2.0

        if overdue_ratio >= 1.5:
            risk = "critical"
            rec = "Immediate maintenance required"
        elif overdue_ratio >= 1.0:
            risk = "high"
            rec = "Maintenance overdue, schedule ASAP"
        elif overdue_ratio >= 0.8:
            risk = "medium"
            rec = "Maintenance due soon, plan scheduling"
        else:
            risk = "low"
            rec = "Equipment in good standing"

        return {
            "risk_level": risk,
            "days_until_due": days_until,
            "confidence": 1.0,
            "recommendation": rec,
            "estimated_cost": None,
            "method": "rule-based",
            "fallback_used": True,
        }

    # ─── Analytics Insights ──────────────────────────────────────────────────
    async def generate_insights(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate AI-powered business insights from analytics metrics."""
        if not self.available:
            return self._rule_based_insights(metrics)

        prompt = f"""Analyze these business metrics and provide actionable insights:
{json.dumps(metrics, indent=2, default=str)}

Provide ONLY valid JSON:
{{"insights": [
  {{"title": "...", "description": "...", "impact": "high|medium|low", "category": "revenue|efficiency|growth|risk", "action": "recommended action"}}
]}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=800,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            insights = result.get("insights", [])
            for i in insights:
                i["method"] = "ai"
                i["fallback_used"] = False
            return insights
        except Exception as e:
            logger.error(f"AI insights generation failed: {e}")
            return self._rule_based_insights(metrics)

    def _rule_based_insights(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Rule-based insights generation."""
        insights = []
        total_bookings = metrics.get("total_bookings", 0)
        total_revenue = metrics.get("total_revenue", 0)
        total_contacts = metrics.get("total_contacts", 0)

        if total_bookings > 50:
            insights.append({
                "title": "High Booking Volume",
                "description": f"You have {total_bookings} bookings—consider hiring more staff.",
                "impact": "high",
                "category": "efficiency",
                "action": "Review staffing levels",
                "method": "rule-based",
                "fallback_used": True,
            })
        if total_contacts > 0 and total_bookings / max(total_contacts, 1) < 0.3:
            insights.append({
                "title": "Low Conversion Rate",
                "description": "Less than 30% of contacts book appointments.",
                "impact": "medium",
                "category": "growth",
                "action": "Improve follow-up process",
                "method": "rule-based",
                "fallback_used": True,
            })
        if not insights:
            insights.append({
                "title": "Business Overview",
                "description": f"{total_bookings} bookings, {total_contacts} contacts, ${total_revenue:.0f} revenue.",
                "impact": "low",
                "category": "revenue",
                "action": "Keep monitoring trends",
                "method": "rule-based",
                "fallback_used": True,
            })
        return insights

    # ─── Report Summary ──────────────────────────────────────────────────────
    async def generate_summary(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered report summary."""
        if not self.available:
            return self._rule_based_summary(metrics)

        prompt = f"""Generate a concise business report summary based on these metrics:
{json.dumps(metrics, indent=2, default=str)}

Provide ONLY valid JSON:
{{"summary": "2-3 sentence overview", "highlights": ["highlight1", "highlight2", "highlight3"], "recommendations": ["rec1", "rec2"], "overall_trend": "improving|stable|declining"}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=500,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            result["method"] = "ai"
            result["fallback_used"] = False
            return result
        except Exception as e:
            logger.error(f"AI summary generation failed: {e}")
            return self._rule_based_summary(metrics)

    def _rule_based_summary(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based report summary."""
        total_bookings = metrics.get("total_bookings", 0)
        total_revenue = metrics.get("total_revenue", 0)
        return {
            "summary": f"Period recorded {total_bookings} bookings with ${total_revenue:.0f} in revenue.",
            "highlights": [
                f"{total_bookings} total bookings",
                f"${total_revenue:.0f} revenue",
                f"{metrics.get('total_contacts', 0)} contacts",
            ],
            "recommendations": [
                "Review booking trends weekly",
                "Follow up with inactive contacts",
            ],
            "overall_trend": "stable",
            "method": "rule-based",
            "fallback_used": True,
        }


# Singleton instance
ai_service = AIService()
