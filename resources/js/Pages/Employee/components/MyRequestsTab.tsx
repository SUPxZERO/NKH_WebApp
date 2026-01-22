import React from 'react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import {
    Clock,
    MapPin,
    Briefcase,
    CheckCircle,
    XCircle,
    UserCheck,
    Ban,
} from 'lucide-react';

interface ShiftSwap {
    id: number;
    shift_id: number;
    requester_id: number;
    recipient_id: number | null;
    type: 'give_away' | 'trade';
    status: 'pending' | 'accepted_by_peer' | 'approved' | 'denied' | 'cancelled';
    reason: string | null;
    created_at: string;
    approved_at: string | null;
    approved_by: number | null;
    denial_reason: string | null;
    shift: {
        id: number;
        date: string;
        start_time: string;
        end_time: string;
        position: { name: string };
        location: { name: string };
    };
    requester: {
        id: number;
        user: { name: string };
    };
    recipient?: {
        id: number;
        user: { name: string };
    } | null;
}

interface MyRequestsTabProps {
    myRequests: { data: ShiftSwap[] } | undefined;
    isLoading: boolean;
    onCancelRequest: (id: number) => void;
    isCancelling: boolean;
}

export default function MyRequestsTab({
    myRequests,
    isLoading,
    onCancelRequest,
    isCancelling,
}: MyRequestsTabProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Pending
                    </span >
                );
            case 'accepted_by_peer':
                return (
                    <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                        < UserCheck className ="w-4 h-4" /> Awaiting Approval
                                </span >
                            );
            case 'approved':
                return (
                    <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 border border-green-500/30">
                        Approved
                    </span >
                );
            case 'denied':
                return (
                    <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/30">
                Denied
                    </span >
                );
            case 'cancelled':
                return (
                    <span className="px-3 py-1 rounded-full text-sm bg-gray-500/20 text-gray-400 border border-gray-500/30">
                Cancelled
                    </span >
                );
            default:
    return null;
}
    };

return (
    <div className="grid gap-4">
        < Card className ="bg-white/5 border-white/10">
            < CardHeader >
            <h3 className="text-lg font-semibold">My Shift Swap Requests</h3>
                < p className ="text-sm text-gray-400">
                        Track all your shift swap requests and their status.
                    </p >
                </CardHeader >
    <CardContent>
        {isLoading ? (
            <div className="space-y-4">
        {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
                            ))}
    </div>
                    ) : myRequests?.data && myRequests.data.length > 0 ? (
    <div className="space-y-4">
{
    myRequests.data.map((swap: ShiftSwap) => {
        const canCancel = swap.status === 'pending';

        return (
            <div
                key={swap.id}
                className="p-5 rounded-xl bg-white/5 border border-white/10"
                    >
                    <div className="flex justify-between items-start mb-4">
                        < div >
                        <div className="font-bold text-xl text-white mb-1">
        {
            new Date(swap.shift.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            })
        }
                                                </div >
            <div className="text-fuchsia-400 font-medium text-lg">
        { swap.shift.start_time } - { swap.shift.end_time }
                                                </div >
                                            </div >
            { getStatusBadge(swap.status)
}
                                        </div >

    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        < div className="flex items-center gap-2 text-gray-300">
            < Briefcase className ="w-4 h-4 text-fuchsia-400" />
                < span > { swap.shift.position?.name || 'N/A' }</span >
                                            </div >
    <div className="flex items-center gap-2 text-gray-300">
        < MapPin className ="w-4 h-4 text-fuchsia-400" />
            < span > { swap.shift.location?.name || 'N/A' }</span >
                                            </div >
    <div className="text-gray-400">
Type: { ' ' }
<span className="text-white capitalize">
{ swap.type.replace('_', ' ') }
                                                </span >
                                            </div >
    <div className="text-gray-400">
Created: { ' ' }
<span className="text-white">
{ new Date(swap.created_at).toLocaleDateString() }
                                                </span >
                                            </div >
                                        </div >

{
    swap.reason && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <div className="text-xs text-gray-400 mb-1">Reason:</div>
        <div className="text-sm text-gray-200">{swap.reason}</div>
                                            </div>
                                        )}

{
    swap.status === 'accepted_by_peer' && swap.recipient && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            < div className="text-sm text-blue-300">
                < UserCheck className ="w-4 h-4 inline mr-2" />
                                                    Claimed by < strong > { swap.recipient.user?.name }</strong > -{ ' '}
                                                    awaiting manager approval
                                                </div >
                                            </div >
                                        )
}

{
    swap.status === 'approved' && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            < div className="text-sm text-green-300">
                < CheckCircle className ="w-4 h-4 inline mr-2" />
                                                    Approved on{ ' ' }
    { new Date(swap.approved_at!).toLocaleDateString() }
    {
        swap.recipient &&
        ` - Shift transferred to ${swap.recipient.user?.name}`
    }
                                                </div >
                                            </div >
                                        )
}

{
    swap.status === 'denied' && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            < div className="text-sm text-red-300">
                < XCircle className ="w-4 h-4 inline mr-2" />
                                                    Denied on { new Date(swap.approved_at!).toLocaleDateString() }
                                                </div >
    {
        swap.denial_reason && (
            <div className="mt-2 text-xs text-red-200">
                                                        Reason: { swap.denial_reason }
                                                    </div >
                                                )
}
                                            </div >
                                        )}

{
    canCancel && (
        <Button
            onClick={() => onCancelRequest(swap.id)}
            variant="outline"
    className ="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
    leftIcon = {< Ban className ="w-4 h-4" />}
    disabled = { isCancelling }
        >
        { isCancelling? 'Cancelling...': 'Cancel Request' }
                                            </Button >
                                        )
}
                                    </div >
                                );
                            })}
                        </div >
                    ) : (
    <div className="text-center py-10 text-gray-400">
        < div className ="text-4xl mb-2">📋</div>
            < p > You haven't created any shift swap requests yet.</p>
                        </div >
                    )}
                </CardContent >
            </Card >
        </div >
    );
}
