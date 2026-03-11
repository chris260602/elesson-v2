"use client";

import { getUserPermissions } from "@/apiRoutes/auth";
import { useCustomAppStore } from "@/providers/CustomAppProvider";
import { useEffect } from "react";

export default function PermissionHandler() {
  const { addPermission, removePermission,setIsFetchingPermission } = useCustomAppStore((state)=>state);

  useEffect(() => {
    // const getPermission = async () => {
    //   setIsFetchingPermission(true);
    //   const permissionData = await getUserPermissions();

    //   if (permissionData) {
    //     // If data is fetched, populate the store
    //     addPermission(permissionData.data);
    //   } else {
    //     // If fetch fails (e.g., 401 error), ensure the store is logged out
    //     removePermission();
    //   }
    //   setIsFetchingPermission(false);
    // };

    // getPermission();
  }, []); // Dependencies for the effect

  // This component doesn't render any UI, it just handles a side effect.
  return null;
}
