"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { User } from "@/lib/validations/user"
import AxiosInstance from "@/utils/axiosInstance"

export default function ViewUserPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Fetch user details
    AxiosInstance.get(`/api/v2/users/${params.id}`).then((res) => {
      setUser(res.data.data)
    })
  }, [params.id])

  if (!user) return <div>Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold">View User</h3>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-slate-50 p-3 rounded">
              <dt className="text-sm font-medium text-gray-500">Username</dt>
              <dd className="text-sm font-semibold text-gray-900">{user.username}</dd>
            </div>
            <div className="p-3">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm font-semibold text-gray-900">{user.name}</dd>
            </div>
            <div className="bg-slate-50 p-3 rounded">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm font-semibold text-gray-900">{user.email}</dd>
            </div>
            <div className="p-3">
              <dt className="text-sm font-medium text-gray-500">Active Role</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {Array.isArray(user.active_role) ? user.active_role[0] : user.active_role}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex justify-end">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}