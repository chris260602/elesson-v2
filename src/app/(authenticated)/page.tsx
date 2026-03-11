"use client"
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calculator, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Lightbulb, 
  Pi, 
  Sigma, 
  CheckCircle2 
} from "lucide-react";

const DashboardWelcome = () => {
  return (
    <div className="min-h-screen w-full flex justify-center items-start pt-12 md:pt-20 bg-slate-50/50">
      
      {/* Main Card */}
      <Card className="w-full max-w-2xl shadow-xl border-slate-200 bg-white">
        <CardContent className="p-10 md:p-14 text-center">
          
          {/* 1. Top Decorative Icons */}
          <div className="flex justify-center items-center gap-6 mb-8">
            <div className="h-14 w-14 flex items-center justify-center bg-indigo-50 rounded-2xl rotate-3 transition-transform hover:rotate-6 duration-300">
              <Calculator className="h-7 w-7 text-indigo-600" />
            </div>
            <div className="h-16 w-16 flex items-center justify-center bg-blue-50 rounded-2xl -rotate-3 transition-transform hover:-rotate-6 duration-300 z-10 shadow-sm">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            <div className="h-14 w-14 flex items-center justify-center bg-sky-50 rounded-2xl rotate-3 transition-transform hover:rotate-6 duration-300">
              <BookOpen className="h-7 w-7 text-sky-600" />
            </div>
          </div>

          {/* 2. Welcome Headline */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Math Mavens</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">
            Your dedicated space for discovery, practice, and mastering the language of numbers.
          </p>

          {/* 3. Status Badges (Generic) */}
          <div className="flex justify-center gap-3 mb-10 flex-wrap">
            <Badge variant="secondary" className="px-4 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Ready to Learn
            </Badge>
            <Badge variant="outline" className="px-4 py-1.5 border-slate-200 text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              System Online
            </Badge>
            <Badge variant="outline" className="px-4 py-1.5 border-slate-200 text-slate-600 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5" />
              New Topics Available
            </Badge>
          </div>

          {/* 4. Motivational Quote Box */}
          <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-10 border border-slate-100">
            {/* Quote decorative marks */}
            <span className="absolute top-4 left-6 text-4xl text-slate-300 font-serif leading-none">“</span>
            
            <p className="text-lg text-slate-700 font-medium italic relative z-10">
              Pure mathematics is, in its way, the poetry of logical ideas.
            </p>
            <p className="text-sm text-slate-400 mt-3 font-semibold uppercase tracking-wider">
              — Albert Einstein
            </p>
            
            <span className="absolute bottom-[-10px] right-6 text-4xl text-slate-300 font-serif leading-none rotate-180">“</span>
          </div>

          {/* 5. Bottom Decorative Icons (Low Opacity) */}
          <div className="flex justify-center gap-8 opacity-20 hover:opacity-40 transition-opacity duration-500">
            <Pi className="h-6 w-6 text-slate-600" />
            <Sigma className="h-6 w-6 text-slate-600" />
            <Sparkles className="h-6 w-6 text-slate-600" />
            <Calculator className="h-6 w-6 text-slate-600" />
            <BookOpen className="h-6 w-6 text-slate-600" />
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardWelcome;