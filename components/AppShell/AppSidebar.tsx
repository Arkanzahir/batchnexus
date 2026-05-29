"use client";

import { Box, Group, Stack, Text, UnstyledButton, rem } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconTruckReturn,
  IconTestPipe,
  IconBoxSeam,
  IconBuildingWarehouse,
  IconMessageChatbot,
  IconHistory,
  IconLogout,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classes from "./AppSidebar.module.css";

const MOCKDATA = [
  { icon: IconLayoutDashboard, label: "Dashboard", link: "/" },
  { icon: IconTruckReturn, label: "Inbound Intake", link: "/intake" },
  { icon: IconTestPipe, label: "QC Station", link: "/qc" },
  { icon: IconBoxSeam, label: "Lots", link: "/lots" },
  { icon: IconBuildingWarehouse, label: "Warehouse", link: "/warehouse" },
  { icon: IconMessageChatbot, label: "Ops Copilot", link: "/copilot" },
  { icon: IconHistory, label: "Audit Log", link: "/audit" },
];

export function AppSidebar() {
  const pathname = usePathname();

  const links = MOCKDATA.map((item) => (
    <UnstyledButton
      component={Link}
      href={item.link}
      className={classes.link}
      data-active={pathname === item.link || undefined}
      key={item.label}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </UnstyledButton>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between">
          <Text fw={700} size="xl" c="white">
            Sima Arôme
          </Text>
        </Group>
        <Box mt="xl">{links}</Box>
      </div>

      <div className={classes.footer}>
        <UnstyledButton className={classes.link}>
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Logout</span>
        </UnstyledButton>
      </div>
    </nav>
  );
}
