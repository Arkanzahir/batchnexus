"use client";

import { Title, Text, Card, SimpleGrid, Group } from "@mantine/core";

export default function Home() {
  return (
    <div>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Operations Dashboard</Title>
          <Text c="dimmed">Welcome back to Sima Arôme BatchNexus</Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Card withBorder padding="lg" radius="md">
          <Text size="sm" c="dimmed" fw={500} tt="uppercase">
            Pending QC
          </Text>
          <Text size="xl" fw={700} mt="sm">
            12 Lots
          </Text>
        </Card>
        
        <Card withBorder padding="lg" radius="md">
          <Text size="sm" c="dimmed" fw={500} tt="uppercase">
            Warehouse Capacity
          </Text>
          <Text size="xl" fw={700} mt="sm">
            84%
          </Text>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Text size="sm" c="dimmed" fw={500} tt="uppercase">
            Active Dispatches
          </Text>
          <Text size="xl" fw={700} mt="sm">
            3 Shipments
          </Text>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Text size="sm" c="dimmed" fw={500} tt="uppercase">
            AI Operations
          </Text>
          <Text size="xl" fw={700} mt="sm">
            System Healthy
          </Text>
        </Card>
      </SimpleGrid>
    </div>
  );
}
