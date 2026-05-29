import { Container, Title, Text, SimpleGrid, Paper, Stack, Badge, Center, ThemeIcon } from "@mantine/core";
import { IconFileScan, IconUpload } from "@tabler/icons-react";
import { IntakeForm } from "./IntakeForm";

export default function IntakePage() {
  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <div>
          <Title order={2}>Inbound Intake</Title>
          <Text c="dimmed">Register new raw material deliveries and extract manifest data using AI.</Text>
        </div>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          {/* Left Column: Form */}
          <div>
            <IntakeForm />
          </div>

          {/* Right Column: AI Scanner visualization */}
          <div>
            <Paper withBorder p="xl" radius="md" style={{ height: '100%', minHeight: 400, backgroundColor: 'var(--ds-gray-100, #f7f5ef)' }}>
              <Stack align="center" justify="center" style={{ height: '100%' }}>
                <ThemeIcon size={80} radius="xl" variant="light" color="gray">
                  <IconFileScan size={40} />
                </ThemeIcon>
                
                <Title order={4} mt="md">Document Scanner</Title>
                <Text c="dimmed" size="sm" ta="center" maw={300}>
                  The AI camera is ready. Click "Auto-Fill with AI" on the form to simulate scanning a physical Delivery Order.
                </Text>

                <Paper withBorder p="md" radius="md" mt="xl" bg="white" w="100%">
                  <Stack gap="xs">
                    <Badge color="primary" variant="dot">Demo Manifest Loaded</Badge>
                    <Text size="xs" c="dimmed" ff="monospace">
                      SUPPLIER: KTA Ponorogo<br/>
                      MATERIAL: Patchouli Leaves<br/>
                      QTY: 500 KG<br/>
                      TEMP: Ambient<br/>
                      REF: DO-2026-X99
                    </Text>
                  </Stack>
                </Paper>
              </Stack>
            </Paper>
          </div>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
