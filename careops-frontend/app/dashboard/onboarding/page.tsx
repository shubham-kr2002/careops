"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Helper to get auth token
const getAuthHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

type OnboardingStep = "workspace" | "integrations" | "services" | "complete";

interface WorkspaceData {
  name: string;
  address: string;
  timezone: string;
  contactEmail: string;
}

interface IntegrationData {
  email: string;
  sms: string;
  calendar: string;
}

interface ServiceData {
  name: string;
  duration: number;
  price: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("workspace");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceData>({
    name: "",
    address: "",
    timezone: "America/New_York",
    contactEmail: "",
  });
  const [integrations, setIntegrations] = useState<IntegrationData>({
    email: "",
    sms: "",
    calendar: "",
  });
  const [services, setServices] = useState<ServiceData[]>([
    { name: "", duration: 60, price: "" },
  ]);

  const handleWorkspaceSubmit = async () => {
    if (!workspace.name || !workspace.contactEmail) return;
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          name: workspace.name,
          address: workspace.address,
          timezone: workspace.timezone,
          contact_email: workspace.contactEmail,
        }),
      });
      if (res.ok) {
        setStep("integrations");
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to create workspace");
      }
    } catch (error) {
      console.error(error);
      setError("Network error");
    }
    setLoading(false);
  };

  const handleIntegrationsSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Save integrations
      if (integrations.email) {
        await fetch("/api/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeader() },
          body: JSON.stringify({
            type: "email",
            name: "Email",
            config: { address: integrations.email },
          }),
        });
      }
      setStep("services");
    } catch (error) {
      console.error(error);
      setError("Failed to save integrations");
    }
    setLoading(false);
  };

  const handleServicesSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      for (const service of services) {
        if (service.name) {
          await fetch("/api/bookings/types", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeader() },
            body: JSON.stringify(service),
          });
        }
      }
      setStep("complete");
    } catch (error) {
      console.error(error);
      setError("Failed to save services");
    }
    setLoading(false);
  };

  const handleComplete = () => {
    router.push("/dashboard");
  };

  const addService = () => {
    setServices([...services, { name: "", duration: 60, price: "" }]);
  };

  const updateService = (index: number, field: keyof ServiceData, value: string | number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            {step === "workspace" && "Set Up Your Workspace"}
            {step === "integrations" && "Connect Your Tools"}
            {step === "services" && "Add Your Services"}
            {step === "complete" && "You're All Set!"}
          </CardTitle>
          <CardDescription>
            {step === "workspace" && "Tell us about your business"}
            {step === "integrations" && "Connect email, SMS, and calendar"}
            {step === "services" && "What services do you offer?"}
            {step === "complete" && "Your workspace is ready to go"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          {step === "workspace" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business Name *</label>
                <Input
                  value={workspace.name}
                  onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
                  placeholder="My Business"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Email *</label>
                <Input
                  type="email"
                  value={workspace.contactEmail}
                  onChange={(e) => setWorkspace({ ...workspace, contactEmail: e.target.value })}
                  placeholder="you@business.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <Input
                  value={workspace.address}
                  onChange={(e) => setWorkspace({ ...workspace, address: e.target.value })}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timezone</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={workspace.timezone}
                  onChange={(e) => setWorkspace({ ...workspace, timezone: e.target.value })}
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <Button
                className="w-full"
                onClick={handleWorkspaceSubmit}
                disabled={loading || !workspace.name || !workspace.contactEmail}
              >
                {loading ? "Saving..." : "Continue"}
              </Button>
            </div>
          )}

          {step === "integrations" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <Input
                  type="email"
                  value={integrations.email}
                  onChange={(e) => setIntegrations({ ...integrations, email: e.target.value })}
                  placeholder="you@business.com"
                />
                <p className="text-xs text-gray-500 mt-1">We'll use this to send and receive emails</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number (for SMS)</label>
                <Input
                  value={integrations.sms}
                  onChange={(e) => setIntegrations({ ...integrations, sms: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Calendar URL</label>
                <Input
                  value={integrations.calendar}
                  onChange={(e) => setIntegrations({ ...integrations, calendar: e.target.value })}
                  placeholder="https://calendar.google.com/..."
                />
              </div>
              <Button className="w-full" onClick={handleIntegrationsSubmit} disabled={loading}>
                {loading ? "Saving..." : "Continue"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep("services")}>
                Skip for now
              </Button>
            </div>
          )}

          {step === "services" && (
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="border rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Service {index + 1}</span>
                    {services.length > 1 && (
                      <button
                        onClick={() => removeService(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <Input
                    value={service.name}
                    onChange={(e) => updateService(index, "name", e.target.value)}
                    placeholder="Service name"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                      <Input
                        type="number"
                        value={service.duration}
                        onChange={(e) => updateService(index, "duration", parseInt(e.target.value))}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Price</label>
                      <Input
                        value={service.price}
                        onChange={(e) => updateService(index, "price", e.target.value)}
                        placeholder="$100"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addService}>
                + Add Another Service
              </Button>
              <Button className="w-full" onClick={handleServicesSubmit} disabled={loading}>
                {loading ? "Saving..." : "Complete Setup"}
              </Button>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <p className="text-gray-600">
                Your workspace is ready! You can now start accepting bookings and managing your business.
              </p>
              <Button className="w-full" onClick={handleComplete}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
