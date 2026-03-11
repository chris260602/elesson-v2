"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { UserForm } from "@/components/users/user-form" // Import the form we made in step 2
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AddUserPage() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // We need the list of roles for the dropdown inside UserForm
    const fetchRoles = async () => {
      try {
        const res = await axios.get("/api/v2/roles")
        setRoles(res.data.data) // Adjust .data.data based on your actual API response
      } catch (error) {
        console.error("Failed to fetch roles", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRoles()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold tracking-tight">Add User</h3>
        <p className="text-muted-foreground">Create a new user account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pass empty initialData for 'Add' mode */}
          <UserForm rolesList={roles} />
        </CardContent>
      </Card>
    </div>
  )
}