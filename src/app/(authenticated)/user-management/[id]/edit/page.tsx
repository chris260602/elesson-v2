"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useParams } from "next/navigation"
import { UserForm } from "@/components/users/user-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "@/lib/validations/user"
import AxiosInstance from "@/utils/axiosInstance"

export default function EditUserPage() {
  const params = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Run both fetches in parallel
        const [userRes, rolesRes] = await Promise.all([
          AxiosInstance.get(`/api/v2/users/${params.id}`),
          AxiosInstance.get("/api/v2/roles")
        ])

        setUser(userRes.data.data)
        setRoles(rolesRes.data.data)
      } catch (error) {
        console.error("Error loading data", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold tracking-tight">Update User</h3>
        <p className="text-muted-foreground">Modify existing user details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit User: {user?.username}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pass the fetched user as initialData */}
          {user && <UserForm initialData={user} rolesList={roles} />}
        </CardContent>
      </Card>
    </div>
  )
}