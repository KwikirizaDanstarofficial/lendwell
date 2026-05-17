"use client"

import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-muted p-6">
          <WifiOff className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            You're Offline
          </h1>
          <p className="text-muted-foreground max-w-md">
            It looks like you've lost your internet connection. 
            Please check your connection and try again.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button 
            onClick={() => window.location.reload()} 
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>

        <div className="mt-8 rounded-lg border bg-card p-6 max-w-md">
          <h2 className="font-semibold text-card-foreground mb-3">
            While you're offline:
          </h2>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Some cached pages may still be available</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Your data will sync when you're back online</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Check your WiFi or mobile data connection</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
