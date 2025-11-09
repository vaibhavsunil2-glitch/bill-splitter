"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface MemberSetupProps {
  onMembersReady: (members: string[]) => void
  onCancel: () => void
}

export default function MemberSetup({ onMembersReady, onCancel }: MemberSetupProps) {
  const [step, setStep] = useState<"count" | "names">("count")
  const [memberCount, setMemberCount] = useState<string>("")
  const [memberNames, setMemberNames] = useState<string[]>([])

  const handleCountSubmit = () => {
    const count = Number.parseInt(memberCount)
    if (count < 1 || count > 20) {
      alert("Please enter a number between 1 and 20")
      return
    }
    setMemberNames(Array(count).fill(""))
    setStep("names")
  }

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...memberNames]
    newNames[index] = value
    setMemberNames(newNames)
  }

  const handleNamesSubmit = () => {
    if (memberNames.some((name) => !name.trim())) {
      alert("Please enter all member names")
      return
    }
    onMembersReady(memberNames.map((name) => name.trim()))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        {step === "count" ? (
          <>
            <div>
              <h1 className="text-3xl font-bold">How Many People?</h1>
              <p className="text-muted-foreground mt-2">Enter the number of people sharing this bill</p>
            </div>

            <Input
              type="number"
              min="1"
              max="20"
              value={memberCount}
              onChange={(e) => setMemberCount(e.target.value)}
              placeholder="e.g., 3"
              className="text-lg py-6"
              onKeyDown={(e) => e.key === "Enter" && handleCountSubmit()}
              autoFocus
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleCountSubmit} disabled={!memberCount} className="flex-1">
                Next
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold">Enter Names</h1>
              <p className="text-muted-foreground mt-2">Add the name of each person ({memberNames.length} total)</p>
            </div>

            <div className="space-y-3">
              {memberNames.map((name, index) => (
                <Input
                  key={index}
                  value={name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  placeholder={`Person ${index + 1}`}
                  onKeyDown={(e) => e.key === "Enter" && handleNamesSubmit()}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("count")
                  setMemberCount("")
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleNamesSubmit} className="flex-1">
                Continue
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
