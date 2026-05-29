"use client";

import { useState, useEffect } from "react";
import { 
  TextInput, 
  NumberInput, 
  Select, 
  Button, 
  Group, 
  Stack, 
  Card, 
  Title, 
  Text,
  Loader,
  Badge,
  ActionIcon
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconSparkles, IconCheck, IconRefresh } from "@tabler/icons-react";
import { createItem, fetchItems } from "@/lib/api/client";

export function IntakeForm() {
  const [isScanned, setIsScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dropdown states
  const [suppliers, setSuppliers] = useState<{value: string, label: string}[]>([]);
  const [materials, setMaterials] = useState<{value: string, label: string}[]>([]);

  const form = useForm({
    initialValues: {
      supplierCode: "",
      materialType: "",
      quantity: 0,
      temperatureRequirement: "",
      hazardClass: "Non-Hazardous",
      batchReference: "",
    },
    validate: {
      quantity: (value) => (value > 0 ? null : "Quantity must be greater than 0"),
    },
  });

  useEffect(() => {
    // In a real scenario, we fetch suppliers and materials from DaaS here.
    // For the hackathon, if DB is empty, we provide defaults if fetch fails.
    const loadDropdownData = async () => {
      try {
        const supRes = await fetchItems<{id: string, name: string, code: string}>("suppliers");
        setSuppliers(supRes.data.map(s => ({ value: s.id, label: `${s.name} (${s.code})`})));
      } catch (e) {
        setSuppliers([{ value: "mock-sup-1", label: "Koperasi Tani Atsiri Ponorogo (SUP-KTA-001)" }]);
      }

      try {
        const matRes = await fetchItems<{id: string, name: string, type: string}>("materials");
        setMaterials(matRes.data.map(m => ({ value: m.id, label: m.name })));
      } catch (e) {
        setMaterials([{ value: "mock-mat-1", label: "Patchouli Leaves (Nilam)" }]);
      }
    };
    
    loadDropdownData();
  }, []);

  const handleScanAI = async () => {
    setIsScanning(true);
    try {
      // Simulate calling the AI endpoint with the dummy image
      const response = await fetch("/api/ai/extract-manifest", {
        method: "POST",
        body: JSON.stringify({ imageUrl: "dummy-manifest.jpg" }),
        headers: { "Content-Type": "application/json" }
      });
      
      const resData = await response.json();
      
      if (resData.data) {
        // Map the AI extracted JSON back to our form
        form.setValues({
          supplierCode: "mock-sup-1", // Should ideally be matched from AI output
          materialType: "mock-mat-1",
          quantity: resData.data.quantity || 500,
          temperatureRequirement: resData.data.temperatureRequirement || "Ambient",
          batchReference: resData.data.batchReference || "DO-2026-X99",
          hazardClass: "Non-Hazardous", // Default
        });
        
        setIsScanned(true);
        notifications.show({
          title: "AI Extraction Successful",
          message: "Manifest data has been successfully parsed and filled.",
          color: "success",
          icon: <IconCheck size={16} />
        });
      }
    } catch (error) {
      notifications.show({
        title: "AI Error",
        message: "Failed to extract data.",
        color: "red",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      // Save to DaaS `inbound_receipts`
      await createItem("inbound_receipts", {
        supplier_id: values.supplierCode !== "mock-sup-1" ? values.supplierCode : null, // handle mock
        material_id: values.materialType !== "mock-mat-1" ? values.materialType : null,
        quantity: values.quantity,
        temperature_requirement: values.temperatureRequirement,
        hazard_class: values.hazardClass,
        batch_reference: values.batchReference,
        status: "Pending QC"
      });
      
      notifications.show({
        title: "Intake Recorded",
        message: "Raw material is now waiting in QC queue.",
        color: "success",
        icon: <IconCheck size={16} />
      });
      
      form.reset();
      setIsScanned(false);
    } catch (error) {
      notifications.show({
        title: "Database Error",
        message: "Failed to record intake.",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="xl" style={{ position: 'relative' }}>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={3}>Receipt Form</Title>
            <Text c="dimmed" size="sm">Manually input data or scan physical document.</Text>
          </div>
          <Button 
            leftSection={isScanning ? <Loader size={16} color="white" /> : <IconSparkles size={16} />}
            variant="gradient"
            gradient={{ from: 'indigo', to: 'cyan' }}
            onClick={handleScanAI}
            disabled={isScanning}
          >
            {isScanning ? "Scanning Document..." : "Auto-Fill with AI"}
          </Button>
        </Group>

        {isScanned && (
          <Badge color="green" variant="light" size="lg" mb="sm">
            ✓ Auto-filled by AI
          </Badge>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Group grow>
              <Select
                label="Supplier"
                placeholder="Select supplier"
                data={suppliers}
                searchable
                required
                {...form.getInputProps("supplierCode")}
              />
              <Select
                label="Material Type"
                placeholder="Select material"
                data={materials}
                searchable
                required
                {...form.getInputProps("materialType")}
              />
            </Group>

            <Group grow>
              <NumberInput
                label="Quantity (kg)"
                placeholder="0"
                min={0}
                required
                {...form.getInputProps("quantity")}
              />
              <TextInput
                label="Batch Reference (DO Number)"
                placeholder="e.g. DO-2026-001"
                required
                {...form.getInputProps("batchReference")}
              />
            </Group>

            <Group grow>
              <Select
                label="Temperature Requirement"
                placeholder="Select requirement"
                data={["Ambient", "Chilled", "Frozen"]}
                required
                {...form.getInputProps("temperatureRequirement")}
              />
              <Select
                label="Hazard Class"
                placeholder="Select hazard class"
                data={["Non-Hazardous", "Flammable-Class3", "Corrosive-Class8"]}
                required
                {...form.getInputProps("hazardClass")}
              />
            </Group>

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => form.reset()}>Reset</Button>
              <Button type="submit" loading={isSubmitting}>Submit to QC</Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Card>
  );
}
