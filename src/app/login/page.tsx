"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeIcon, LoaderCircle, EyeOffIcon, BookOpen, Rocket, Star, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signIn } from "next-auth/react";
import { showErrorMessage, showSuccessMessage } from "@/utils/notificationUtils";
import Image from "next/image";
import { FunButton } from "@/components/core/FunButton";

export default function Home() {
  const schema = z.object({
    username: z.string().nonempty("Please enter your Student ID"), 
    password: z.string().nonempty("Please enter your password"),
  });

  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignIn = async (data: z.infer<typeof schema>) => {
    setIsLoginLoading(true);
    await new Promise(r => setTimeout(r, 800)); // Demo delay
    try {
      const userAgent = navigator.userAgent;
      const isa = await signIn("credentials", {
        email: data.username,
        password: data.password,
        userAgent,
        redirect: false,
      });

      // *Mocking success for UI demo*
      // if (isa?.error) { ... }
      console.log(isa,"isa")
      if(isa.error){
        if(isa.error === "CredentialsSignin"){
          showSuccessMessage("Invalid Credentials!");
        }else{
          showSuccessMessage("Something Went Wrong!");
        }
        return;
      }
      showSuccessMessage("Welcome back!");
      router.push("/");
    } catch (e) {
      console.log(e)
      showSuccessMessage("Something went wrong!"); 
    } finally {
      setIsLoginLoading(false);
    }
  };

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  // Brand Colors
  const PRIMARY_COLOR = "#00b6dd"; // Cyan
  const SECONDARY_COLOR = "#005669"; // Dark Teal

  return (
    // Main Container
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative overflow-hidden"
      style={{ 
        backgroundColor: '#f0faff', 
        // Added the DOTS background back here using the primary brand color
        backgroundImage: `radial-gradient(${PRIMARY_COLOR} 1.5px, transparent 1.5px)`,
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0'
      }} 
    >
      
      {/* Floating Elements (Optional fun touches) */}
      <div className="absolute top-10 left-10 opacity-20 animate-bounce delay-700" style={{ color: PRIMARY_COLOR }}>
        <Star size={48} fill={PRIMARY_COLOR} />
      </div>
      <div className="absolute bottom-20 right-20 opacity-10" style={{ color: SECONDARY_COLOR }}>
        <Rocket size={80} />
      </div>

      {/* Main Card */}
      <div className="bg-white w-full max-w-4xl grid lg:grid-cols-5 rounded-[2.5rem] shadow-xl overflow-hidden border-4 border-white z-10 relative">
        
        {/* --- Left Side: Visual Panel --- */}
        <div 
          className="hidden lg:flex lg:col-span-2 flex-col justify-between p-8 relative overflow-hidden text-white"
          style={{ backgroundColor: SECONDARY_COLOR }} 
        >
          {/* Sidebar Dots Pattern (White dots on Dark Teal) */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:20px_20px]"></div>

          <div className="relative z-10 flex items-center gap-3 font-bold text-xl">
            <div className="bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-sm">
            <Image alt="logo" width={40} height={40} src={"/math-mavens-logo.png"}/>
            </div>
            <span>Math Mavens</span>
          </div>

          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight leading-tight">
              Hello, Student!
            </h2>
            <p className="text-blue-100 text-lg font-medium opacity-90">
              Ready to learn something new today?
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
             <Sparkles className="h-3 w-3 text-white" />
             eLesson Portal
          </div>
        </div>

        {/* --- Right Side: Form Panel --- */}
        <div className="lg:col-span-3 py-10 px-6 sm:px-12 bg-white relative flex flex-col justify-center">
          
          <div className="w-full max-w-[360px] mx-auto space-y-8">
            
            <div className="lg:hidden flex justify-center mb-4">
               <div className="p-3 rounded-2xl inline-flex bg-[#00b6dd]/10">
                  <Image alt="logo" width={40} height={40} src={"/math-mavens-logo.png"}/>
               </div>
            </div>

            <div className="text-center lg:text-left space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-slate-800">
                Let's Log In!
              </h1>
              <p className="text-slate-400 font-medium text-sm">
                Enter your details to start your lesson.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-bold text-slate-600 pl-1">Student ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="S-123456"
                          className="h-12 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-visible:ring-2 focus-visible:ring-offset-0 text-lg font-medium text-slate-700 transition-all placeholder:text-slate-300"
                          style={{ outlineColor: PRIMARY_COLOR }}
                          {...field}
                          disabled={isLoginLoading}
                        />
                      </FormControl>
                      <FormMessage className="pl-1" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-bold text-slate-600 pl-1">Password</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-12 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-visible:ring-2 focus-visible:ring-offset-0 text-lg font-medium text-slate-700 transition-all"
                            {...field}
                            disabled={isLoginLoading}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#00b6dd] transition-colors p-1"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeIcon className="h-5 w-5" />:<EyeOffIcon className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="pl-1" />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <FunButton
                    type="submit"
                    disabled={isLoginLoading}
                  >
                     {isLoginLoading ? (
                      <div className="flex items-center gap-2">
                         <LoaderCircle className="h-5 w-5 animate-spin text-white" />
                         <span>Loading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 fill-white/20" />
                        <span>Start Learning</span>
                      </div>
                    )}
                  </FunButton>
                </div>
              </form>
            </Form>

            <div className="pt-2 text-center">
              <p className="text-xs font-medium text-slate-300">
                Math Mavens &copy; 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}