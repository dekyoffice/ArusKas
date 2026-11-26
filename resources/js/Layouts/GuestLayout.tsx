import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-slate-50 pt-6 sm:justify-center sm:pt-0">
            <div className="flex flex-col items-center">
                <Link href="/">
                    <ApplicationLogo className="h-24 w-auto drop-shadow-sm" />
                </Link>
                <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-slate-800">
                    ArusKas
                </h2>
            </div>

            <div className="mt-8 w-full overflow-hidden bg-white px-8 py-8 shadow-xl sm:max-w-md sm:rounded-2xl border border-slate-100">
                {children}
            </div>
        </div>
    );
}
