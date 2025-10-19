"use client"

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isArabic: boolean;
  arabicFontStyle?: React.CSSProperties;
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  loading: boolean;
  refreshLoading: boolean;
  title: string;
  description: string;
  placeholder: string;
  buttonText: string;
  refreshText: string;
};

export default function FreeSearchCard({ isArabic, arabicFontStyle, value, onChange, onSearch, onRefresh, loading, refreshLoading, title, description, placeholder, buttonText, refreshText }: Props) {
  return (
    <Card className="border-border/60 bg-background/90 shadow-sm">
      <CardHeader className="space-y-2">
        <div>
          <CardTitle style={arabicFontStyle}>{title}</CardTitle>
          <CardDescription style={arabicFontStyle}>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="free-topic" style={arabicFontStyle}>{isArabic ? "موضوع البحث" : "Search topic"}</Label>
          <Input
            id="free-topic"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className={cn("h-10 text-sm", isArabic && "text-right")}
            style={arabicFontStyle}
            disabled={loading || refreshLoading}
          />
        </div>
        <Button type="button" className="h-11 w-full bg-indigo-600 hover:bg-indigo-500" onClick={onSearch} disabled={loading || refreshLoading} style={arabicFontStyle}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {buttonText}
        </Button>
        <Button type="button" variant="outline" className="h-11 w-full" onClick={onRefresh} disabled={refreshLoading} style={arabicFontStyle}>
          {refreshLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          {refreshText}
        </Button>
      </CardContent>
    </Card>
  );
}


