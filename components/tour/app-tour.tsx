"use client"

import { useEffect, useRef } from "react"
import type { DriveStep } from "driver.js"

const steps: DriveStep[] = [
  {
    element: "#tour-sidebar",
    popover: {
      title: "Navigation Sidebar",
      description:
        "All main sections of SaccoOS are accessible here. Click the arrow icon at the top-left to collapse or expand it.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-nav-overview",
    popover: {
      title: "Dashboard",
      description: "Your at-a-glance view of KPIs: members, loans, savings, and recent transactions.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-people",
    popover: {
      title: "People",
      description: "Manage Members and system Users. Add new members, view profiles, and control access roles.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-finance",
    popover: {
      title: "Finance",
      description: "Handle Loans, Savings accounts, and Fines — the core financial operations of your SACCO.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-operations",
    popover: {
      title: "Operations",
      description: "Manage Complaints, Documents, and Notifications to keep day-to-day operations running smoothly.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-settings",
    popover: {
      title: "Settings",
      description: "Configure your SACCO profile, preferences, and system-wide options here.",
      side: "right",
    },
  },
  {
    element: "#tour-user-menu",
    popover: {
      title: "Your Account",
      description: "Click here to view your role, switch accounts, or sign out.",
      side: "top",
    },
  },
  {
    element: "#tour-header-notifications",
    popover: {
      title: "Notifications",
      description: "Unread alerts and system notifications appear here.",
      side: "bottom",
    },
  },
  {
    element: "#tour-header-theme",
    popover: {
      title: "Theme Toggle",
      description: "Switch between light, dark, and system themes.",
      side: "bottom",
    },
  },
  {
    element: "#tour-start-tour",
    popover: {
      title: "Replay this Tour",
      description: "Click this button any time to restart the guided tour.",
      side: "bottom",
      onNextClick: () => {},
    },
  },
]

interface AppTourProps {
  onComplete: () => void
}

export function AppTour({ onComplete }: AppTourProps) {
  const driverRef = useRef<Awaited<ReturnType<typeof import("driver.js")["driver"]>> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const { driver } = await import("driver.js")
      await import("driver.js/dist/driver.css")

      if (cancelled) return

      const driverObj = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayOpacity: 0.6,
        stagePadding: 8,
        stageRadius: 8,
        popoverClass: "saccoos-tour-popover",
        progressText: "{{current}} of {{total}}",
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Done",
        onDestroyStarted: () => {
          driverObj.destroy()
          onComplete()
        },
        steps,
      })

      driverRef.current = driverObj
      driverObj.drive()
    }

    init()

    return () => {
      cancelled = true
      driverRef.current?.destroy()
    }
  }, [onComplete])

  return null
}
