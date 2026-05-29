"use client";

import { Group, Burger, TextInput, Avatar, Text, Select, Menu, ActionIcon } from "@mantine/core";
import { IconSearch, IconBell, IconSettings } from "@tabler/icons-react";
import classes from "./AppTopbar.module.css";
import { useState } from "react";

export function AppTopbar({
  opened,
  toggle,
}: {
  opened: boolean;
  toggle: () => void;
}) {
  const [role, setRole] = useState<string | null>("Manager");

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Group>
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
          <TextInput
            placeholder="Search Lots, Receipts..."
            leftSection={<IconSearch size={16} stroke={1.5} />}
            radius="xl"
            w={300}
            visibleFrom="md"
          />
        </Group>

        <Group>
          {/* Role Switcher for Demo Purposes */}
          <Select
            placeholder="Switch Role"
            data={["Manager", "QC Inspector", "Warehouse Operator"]}
            value={role}
            onChange={setRole}
            size="sm"
            w={180}
            radius="xl"
            leftSection={<IconSettings size={16} />}
          />

          <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
            <IconBell size={20} stroke={1.5} />
          </ActionIcon>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <Group gap={7} className={classes.user}>
                <Avatar src={null} alt="User avatar" radius="xl" size={30} color="primary" />
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={500}>
                    Admin User
                  </Text>
                  <Text size="xs" c="dimmed">
                    admin@simaarome.com
                  </Text>
                </div>
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconSettings size={14} stroke={1.5} />}>
                Account Settings
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </div>
    </header>
  );
}
