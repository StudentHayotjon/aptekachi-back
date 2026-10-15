import { useState } from "react";
import { Icon, type IconName } from "@/components/icons/Icon";
import { BrandMark } from "@/components/layout/BrandMark";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useZodForm } from "@/hooks/useZodForm";
import { loginSchema } from "@/schemas/auth.schema";
import { authService } from "@/services";

const FEATURES: { icon: IconName; text: string }[] = [
    { icon: "activity", text: "Real vaqtdagi statistika va xizmatlar holati" },
    { icon: "scan", text: "Retseptlarni OCR orqali tanib, dori bazasiga moslash" },
    { icon: "shield", text: "Faqat administratorlar uchun himoyalangan kirish" }
];

export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const form = useZodForm(loginSchema, { phone: "+998 ", password: "" });
    // Muvaffaqiyatli login'dan so'ng sessionStore yangilanadi va App o'zi panelga o'tadi
    const submit = () => form.submit((values) => authService.login(values).then(() => undefined));

    return (
        <div className="login">
            <section className="login__art">
                <div className="brand brand--plain">
                    <BrandMark />
                    <div className="brand__name">Aptekachi</div>
                </div>
                <div className="login__pitch">
                    <h2>Dorixona ekotizimini bir joydan boshqaring</h2>
                    <p>Foydalanuvchilar, retseptlar, dorilar katalogi va OCR natijalari — barchasi yagona panelda.</p>
                </div>
                <ul className="login__features">
                    {FEATURES.map((f) => (
                        <li key={f.icon} className="login__feature">
                            <Icon name={f.icon} /> {f.text}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="login__form-wrap">
                <form
                    className="login__form"
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        void submit();
                    }}>
                    <div>
                        <h1>Xush kelibsiz</h1>
                        <p className="text-muted">Administrator hisobingiz bilan kiring</p>
                    </div>

                    {form.formError && <Alert>{form.formError}</Alert>}

                    <Field label="Telefon raqam" error={form.errors.phone}>
                        <div className="input-icon">
                            <Icon name="phone" size={16} />
                            <Input inputMode="tel" autoComplete="username" placeholder="+998 90 123 45 67" value={form.values.phone} onChange={(e) => form.set("phone")(e.target.value)} />
                        </div>
                    </Field>

                    <Field label="Parol" error={form.errors.password}>
                        <div className="input-icon input-icon--action">
                            <Icon name="lock" size={16} />
                            <Input
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                value={form.values.password}
                                onChange={(e) => form.set("password")(e.target.value)}
                            />
                            <Button variant="ghost" size="sm" className="input-icon__action" onClick={() => setShowPassword((v) => !v)}>
                                {showPassword ? "Yashirish" : "Ko'rsatish"}
                            </Button>
                        </div>
                    </Field>

                    <Button type="submit" variant="primary" block loading={form.submitting} className="btn--lg">
                        Kirish
                    </Button>
                </form>
            </section>
        </div>
    );
}
