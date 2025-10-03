"use client"

import { ChevronDown, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function NewReportForm() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-onest">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <span>Players</span>
        <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
        <span className="font-medium text-foreground">New Report</span>
      </nav>

      {/* Main Heading */}
      <h1 className="mb-16 text-6xl font-bold tracking-tight text-foreground">New Report</h1>

      {/* Select Player Section */}
      <div className="relative rounded-lg border border-border bg-card p-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Select player</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Dropdown Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Select>
            <SelectTrigger className="h-14 rounded-lg border-2 border-border bg-background px-6 text-base font-medium">
              <SelectValue placeholder="Reports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technical">Technical Report</SelectItem>
              <SelectItem value="physical">Physical Report</SelectItem>
              <SelectItem value="tactical">Tactical Report</SelectItem>
              <SelectItem value="mental">Mental Report</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="h-14 rounded-lg border-2 border-border bg-background px-6 text-base font-medium">
              <SelectValue placeholder="Passport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal Information</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
              <SelectItem value="visa">Visa Status</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="h-14 rounded-lg border-2 border-border bg-background px-6 text-base font-medium">
              <SelectValue placeholder="Contract" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Contract</SelectItem>
              <SelectItem value="history">Contract History</SelectItem>
              <SelectItem value="negotiations">Negotiations</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="h-14 rounded-lg border-2 border-border bg-background px-6 text-base font-medium">
              <SelectValue placeholder="Initial Info" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profile">Player Profile</SelectItem>
              <SelectItem value="background">Background</SelectItem>
              <SelectItem value="career">Career Overview</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="h-14 rounded-lg border-2 border-border bg-background px-6 text-base font-medium">
              <SelectValue placeholder="Stats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="season">Season Stats</SelectItem>
              <SelectItem value="career">Career Stats</SelectItem>
              <SelectItem value="comparison">Comparison</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}