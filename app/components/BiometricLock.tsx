"use client";

import { useState, useEffect, useRef } from "react";

const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 menit
const PIN_HASH_KEY = "finans_sync_pin_hash";

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "finans-sync-salt-2025");
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function BiometricLock({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [pinError, setPinError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const hasPinStored = typeof window !== "undefined" && !!localStorage.getItem(PIN_HASH_KEY);

  useEffect(() => {
    // Cek grace period
    const lastUnlocked = localStorage.getItem("last_unlocked_at");
    if (lastUnlocked && Date.now() - parseInt(lastUnlocked, 10) < GRACE_PERIOD_MS) {
      setIsLocked(false);
      return;
    }

    // Cek dukungan biometrik
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setBiometricSupported);
    }
  }, []);

  const unlockWithBiometric = async () => {
    setIsLoading(true);
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Ajian Family" },
          user: { id: userId, name: "local_user", displayName: "Local User" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000
        }
      });

      setIsLocked(false);
      localStorage.setItem("last_unlocked_at", Date.now().toString());
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setShowPinInput(true);
      } else {
        // Langsung masuk jika device tidak support
        setIsLocked(false);
        localStorage.setItem("last_unlocked_at", Date.now().toString());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const unlockWithPin = async () => {
    if (pinValue.length < 4) {
      setPinError("PIN minimal 4 digit");
      return;
    }

    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    if (!storedHash) {
      // Belum pernah buat PIN, arahkan ke setup
      setShowPinSetup(true);
      setShowPinInput(false);
      return;
    }

    const inputHash = await hashPin(pinValue);
    if (inputHash === storedHash) {
      setIsLocked(false);
      localStorage.setItem("last_unlocked_at", Date.now().toString());
    } else {
      setPinError("PIN salah, coba lagi");
      setPinValue("");
    }
  };

  const setupPin = async () => {
    if (pinStep === "enter") {
      if (pinValue.length < 4) {
        setPinError("PIN minimal 4 digit");
        return;
      }
      setConfirmPin(pinValue);
      setPinValue("");
      setPinStep("confirm");
      setPinError("");
    } else {
      if (pinValue !== confirmPin) {
        setPinError("PIN tidak cocok, ulangi dari awal");
        setPinValue("");
        setConfirmPin("");
        setPinStep("enter");
        return;
      }
      const hash = await hashPin(pinValue);
      localStorage.setItem(PIN_HASH_KEY, hash);
      setIsLocked(false);
      localStorage.setItem("last_unlocked_at", Date.now().toString());
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  if (showPinSetup) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-1">Buat PIN</h2>
          <p className="text-gray-400 text-sm mb-6">
            {pinStep === "enter" ? "Buat PIN 4-6 digit sebagai cadangan kunci biometrik" : "Ulangi PIN Anda untuk konfirmasi"}
          </p>
          <input
            ref={pinInputRef}
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pinValue}
            onChange={e => { setPinValue(e.target.value.replace(/\D/g, '')); setPinError(""); }}
            placeholder="●●●●"
            className="w-full text-center text-2xl tracking-widest bg-white/10 border border-white/20 rounded-xl py-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary mb-3"
          />
          {pinError && <p className="text-red-400 text-xs mb-3 text-center">{pinError}</p>}
          <button onClick={setupPin} className="w-full py-3 bg-primary hover:bg-emerald-500 text-white rounded-xl font-bold transition-all active:scale-95">
            {pinStep === "enter" ? "Lanjut" : "Konfirmasi & Simpan PIN"}
          </button>
        </div>
      </div>
    );
  }

  if (showPinInput) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-1">Masukkan PIN</h2>
          <p className="text-gray-400 text-sm mb-6">Masukkan PIN Anda untuk membuka aplikasi</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pinValue}
            onChange={e => { setPinValue(e.target.value.replace(/\D/g, '')); setPinError(""); }}
            placeholder="●●●●"
            autoFocus
            className="w-full text-center text-2xl tracking-widest bg-white/10 border border-white/20 rounded-xl py-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary mb-3"
          />
          {pinError && <p className="text-red-400 text-xs mb-3 text-center">{pinError}</p>}
          <button onClick={unlockWithPin} className="w-full py-3 bg-primary hover:bg-emerald-500 text-white rounded-xl font-bold transition-all active:scale-95 mb-3">
            Buka Kunci
          </button>
          {!hasPinStored && (
            <button onClick={() => setShowPinSetup(true)} className="w-full py-2 text-gray-400 text-sm hover:text-white transition-colors">
              Belum punya PIN? Buat sekarang
            </button>
          )}
        </div>
      </div>
    );
  }

  // Layar Utama: Kunci Biometrik
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white shadow-[0_0_40px_rgba(5,150,105,0.3)] mb-8">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2 text-white">App Locked</h1>
      <p className="text-gray-400 text-center mb-10 max-w-xs text-sm">
        Ajian Family terkunci demi keamanan data Anda.
      </p>
      <button
        onClick={unlockWithBiometric}
        disabled={isLoading}
        className="px-8 py-4 bg-primary hover:bg-emerald-500 text-white rounded-full font-bold shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center gap-2 mb-4 disabled:opacity-60"
      >
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
        )}
        {biometricSupported ? "Buka dengan Fingerprint / Face" : "Buka Aplikasi"}
      </button>
      <button
        onClick={() => setShowPinInput(true)}
        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        Gunakan PIN sebagai gantinya
      </button>
    </div>
  );
}
