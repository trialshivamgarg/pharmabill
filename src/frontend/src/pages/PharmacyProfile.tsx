import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import {
  type PharmacyProfile,
  getPharmacyProfile,
  savePharmacyProfile,
} from "../hooks/usePharmacyProfile";

export default function PharmacyProfilePage() {
  const [form, setForm] = useState<PharmacyProfile>(getPharmacyProfile);

  function handleChange(field: keyof PharmacyProfile, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    savePharmacyProfile(form);
    toast.success("Pharmacy profile saved successfully.");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pharmacy Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          These details appear on every printed GST invoice. Update them
          anytime.
        </p>
      </div>

      <div className="bg-white border border-border rounded-lg p-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Pharmacy Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter pharmacy name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address1">Address Line 1</Label>
          <Input
            id="address1"
            value={form.address1}
            onChange={(e) => handleChange("address1", e.target.value)}
            placeholder="Street / Area"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address2">Address Line 2</Label>
          <Input
            id="address2"
            value={form.address2}
            onChange={(e) => handleChange("address2", e.target.value)}
            placeholder="City, State, PIN"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Contact number"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Email address"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gstin">GSTIN</Label>
          <Input
            id="gstin"
            value={form.gstin}
            onChange={(e) =>
              handleChange("gstin", e.target.value.toUpperCase())
            }
            placeholder="e.g. 07BXUPG3995C1Z1"
            className="uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dlNo1">D.L. No. 1</Label>
            <Input
              id="dlNo1"
              value={form.dlNo1}
              onChange={(e) => handleChange("dlNo1", e.target.value)}
              placeholder="e.g. RLF20DL2025001813"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dlNo2">D.L. No. 2</Label>
            <Input
              id="dlNo2"
              value={form.dlNo2}
              onChange={(e) => handleChange("dlNo2", e.target.value)}
              placeholder="e.g. 1805"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} className="w-full">
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
