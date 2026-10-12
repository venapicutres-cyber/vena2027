import { useQuery } from '@tanstack/react-query';
import { listClients } from '../services/clients';
import { listProjectsWithRelations } from '../services/projects';
import { listTransactions } from '../services/transactions';
import { listTeamMembers } from '../services/teamMembers';
import { listLeads } from '../services/leads';
import { listCards, normalizeCard } from '../services/cards';
import { listPockets } from '../services/pockets';
import { listPackages } from '../services/packages';
import { listAddOns } from '../services/addOns';
import { listCalendarEvents } from '../services/calendarEvents';
import { listContracts } from '../services/contracts';
import { listPromoCodes } from '../services/promoCodes';
import { getProfile } from '../services/profile';
import { listAllTeamPayments } from '../services/teamProjectPayments';
import { listTeamPaymentRecords } from '../services/teamPaymentRecords';
import { listNotifications } from '../services/notifications';

// Limit default fetches to 100 for performance
const DEFAULT_LIMIT = 100;

export const useClientsQuery = () => useQuery({
    queryKey: ['clients'],
    queryFn: () => listClients({ limit: 5000 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useProjectsQuery = () => useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjectsWithRelations({ limit: 5000 }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useTransactionsQuery = () => useQuery({
    queryKey: ['transactions'],
    queryFn: () => listTransactions({ limit: DEFAULT_LIMIT }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useTeamMembersQuery = () => useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => listTeamMembers({ limit: DEFAULT_LIMIT }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useLeadsQuery = () => useQuery({
    queryKey: ['leads'],
    queryFn: () => listLeads({ limit: DEFAULT_LIMIT }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useCardsQuery = () => useQuery({
    queryKey: ['cards'],
    queryFn: () => listCards().then(res => res.map(normalizeCard)),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const usePocketsQuery = () => useQuery({
    queryKey: ['pockets'],
    queryFn: () => listPockets(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const usePackagesQuery = () => useQuery({
    queryKey: ['packages'],
    queryFn: () => listPackages(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useAddOnsQuery = () => useQuery({
    queryKey: ['addOns'],
    queryFn: () => listAddOns(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useCalendarEventsQuery = () => useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => listCalendarEvents(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

// ─── Auxiliary domain queries ────────────────────────────────────────────
// Migrated from useAuxiliaryData's useEffect+useState pattern.
// React Query is the single source of truth for these too.

export const useContractsQuery = () => useQuery({
    queryKey: ['contracts'],
    queryFn: () => listContracts(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const usePromoCodesQuery = () => useQuery({
    queryKey: ['promoCodes'],
    queryFn: () => listPromoCodes(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useProfileQuery = () => useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useTeamProjectPaymentsQuery = () => useQuery({
    queryKey: ['teamProjectPayments'],
    queryFn: () => listAllTeamPayments(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useTeamPaymentRecordsQuery = () => useQuery({
    queryKey: ['teamPaymentRecords'],
    queryFn: () => listTeamPaymentRecords(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});

export const useNotificationsQuery = () => useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications(),
    staleTime: 60 * 1000, // 1 minute — notifications change often
    refetchOnWindowFocus: false,
    refetchOnMount: false,
});
