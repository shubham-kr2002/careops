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
            self.model = "llama-3.2-90b-text-preview"
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


# Singleton instance
ai_service = AIService()
