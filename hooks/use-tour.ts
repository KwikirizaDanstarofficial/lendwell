"use client"

import { useCallback, useEffect, useState } from "react"

const TOUR_KEY = "saccoos-tour-completed"

export function useTour() {
  const [tourEnabled, setTourEnabled] = useState(false)
  const [shouldAutoStart, setShouldAutoStart] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY)
    if (!completed) {
      setShouldAutoStart(true)
    }
  }, [])

  const startTour = useCallback(() => {
    setTourEnabled(true)
  }, [])

  const completeTour = useCallback(() => {
    setTourEnabled(false)
    localStorage.setItem(TOUR_KEY, "true")
    setShouldAutoStart(false)
  }, [])

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_KEY)
    setShouldAutoStart(false)
    setTourEnabled(true)
  }, [])

  return { tourEnabled, shouldAutoStart, startTour, completeTour, resetTour }
}
