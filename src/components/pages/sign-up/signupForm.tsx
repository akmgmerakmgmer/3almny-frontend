"use client"
import React, { useRef } from 'react'
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import InputComponent from '@/components/Inputs/inputComponent';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { GlobeAltIcon } from "@heroicons/react/24/outline"; // placeholder for Google icon
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline"; // placeholder for Apple icon
import Link from "next/link";
import { useT } from '@/i18n/useT';

export default function SignupForm() {
    const { t } = useT();
    const email = useRef("");
    const password = useRef("");
    const repeatPassword = useRef("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    }

    return (
        <CardContent className="space-y-5">
            <form className="space-y-5">
                <div className="space-y-2">
                    <InputComponent label={t('auth.signup.email')} onChange={(e) => email.current = e.target.value}/>
                </div>
                <div className="space-y-2">
                    <InputComponent label={t('auth.signup.password')} type='password' onChange={(e) => password.current = e.target.value} />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Use 8 or more characters with a mix of letters, numbers & symbols.
                    </p>
                </div>
                <div className="space-y-2">
                    <InputComponent label={t('auth.signup.repeatPassword')} type='password' onChange={(e) => repeatPassword.current = e.target.value} />
                </div>
                <div className="flex items-start gap-2">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-xs font-normal leading-snug">
                        {t('auth.terms.accept')}<span className="text-primary font-medium">{t('auth.terms.term')}</span>
                    </Label>
                </div>
                <Separator className="my-2" />
                <div className="flex flex-col md:flex-row gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-10 gap-2">
                        <GlobeAltIcon className="h-5 w-5" aria-hidden />
                        <span className="text-sm">{t('auth.signup.with.google')}</span>
                    </Button>
                    <Button type="button" variant="outline" className="flex-1 h-10 gap-2">
                        <DevicePhoneMobileIcon className="h-5 w-5" aria-hidden />
                        <span className="text-sm">{t('auth.signup.with.apple')}</span>
                    </Button>
                </div>
                <Button type="submit" className="w-full h-11 text-sm font-medium" onClick={handleSubmit}>
                    {t('auth.signup.submit')}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    {t('auth.signup.haveAccount')}{' '}
                    <Link href="#" className="text-primary hover:underline">
                        {t('auth.signup.signinLink')}
                    </Link>
                </p>
            </form>
        </CardContent>
    )
}
