"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarClock,
  CarFront,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  Droplets,
  FileCheck2,
  FileText,
  Fuel,
  Gauge,
  LayoutDashboard,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Printer,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  TrendingUp,
  UserRound,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, numberFormatter } from "@/lib/format";
import type {
  DocumentRecord,
  FleetData,
  FuelRecord,
  MaintenanceRecord,
  VehicleRecord,
} from "@/lib/fleet-types";

type View = "dashboard" | "vehicles" | "fuel" | "maintenance" | "documents" | "reports";

const navItems: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "vehicles", label: "Viaturas", icon: CarFront },
  { id: "fuel", label: "Abastecimentos", icon: Fuel },
  { id: "maintenance", label: "Manutenção", icon: Wrench },
  { id: "documents", label: "Documentos", icon: FileCheck2 },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
];

const viewTitles: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: "Visão geral", subtitle: "Acompanhe o desempenho e os alertas da sua frota." },
  vehicles: { title: "Viaturas", subtitle: "Cadastro, utilização e estado operacional da frota." },
  fuel: { title: "Abastecimentos", subtitle: "Consumos, custos e quilometragem registada." },
  maintenance: { title: "Manutenção", subtitle: "Planeamento preventivo e histórico de intervenções." },
  documents: { title: "Documentos", subtitle: "Validades, seguros, inspecções e documentação legal." },
  reports: { title: "Relatórios", subtitle: "Indicadores consolidados para decisão e auditoria." },
};

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 dark:bg-input/30";

function getValue(form: FormData, key: string) {
  return String(form.get(key) ?? "");
}

async function requestJson<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Não foi possível concluir a operação.");
  return data as T;
}

function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(`${date}T12:00:00`).getTime() - today.getTime()) / 86_400_000);
}

function vehicleName(vehicle: VehicleRecord | undefined) {
  return vehicle ? `${vehicle.brand} ${vehicle.model}` : "Viatura removida";
}

function StatusBadge({ status }: { status: VehicleRecord["status"] }) {
  const styles = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    maintenance: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    inactive: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  const labels = { active: "Operacional", maintenance: "Em manutenção", inactive: "Inactiva" };
  return <Badge variant="outline" className={styles[status]}>{labels[status]}</Badge>;
}

function MaintenanceBadge({ status }: { status: MaintenanceRecord["status"] }) {
  const labels = { scheduled: "Agendada", in_progress: "Em curso", completed: "Concluída" };
  const style = status === "completed" ? "bg-emerald-50 text-emerald-700" : status === "in_progress" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700";
  return <Badge variant="outline" className={style}>{labels[status]}</Badge>;
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
      <div className="mb-3 rounded-xl bg-muted p-3 text-muted-foreground"><Icon className="size-6" /></div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function FleetApp({ initialData }: { initialData: FleetData }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>("dashboard");
  const [query, setQuery] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [fuelDialog, setFuelDialog] = useState(false);
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [documentDialog, setDocumentDialog] = useState(false);

  const vehicleMap = useMemo(
    () => new Map(data.vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [data.vehicles],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredVehicles = data.vehicles.filter((vehicle) =>
    [vehicle.registration, vehicle.brand, vehicle.model, vehicle.driver, vehicle.costCenter]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
  );
  const filteredFuel = data.fuelEntries.filter((entry) => {
    const vehicle = vehicleMap.get(entry.vehicleId);
    return [vehicle?.registration, vehicleName(vehicle), entry.supplier, entry.invoiceNumber]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
  const filteredMaintenance = data.maintenanceEntries.filter((entry) => {
    const vehicle = vehicleMap.get(entry.vehicleId);
    return [vehicle?.registration, vehicleName(vehicle), entry.description, entry.supplier]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
  const filteredDocuments = data.documents.filter((document) => {
    const vehicle = vehicleMap.get(document.vehicleId);
    return [vehicle?.registration, vehicleName(vehicle), document.type, document.reference]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  const activeVehicles = data.vehicles.filter((vehicle) => vehicle.status === "active").length;
  const totalFuel = data.fuelEntries.reduce((sum, entry) => sum + Number(entry.totalCost), 0);
  const totalMaintenance = data.maintenanceEntries.reduce((sum, entry) => sum + Number(entry.cost), 0);
  const expiringDocuments = data.documents.filter((document) => daysUntil(document.validUntil) <= 45).length;
  const availability = data.vehicles.length ? Math.round((activeVehicles / data.vehicles.length) * 100) : 0;

  const chartData = useMemo(() => {
    const months = [
      ["2026-03", "Mar"], ["2026-04", "Abr"], ["2026-05", "Mai"],
      ["2026-06", "Jun"], ["2026-07", "Jul"], ["2026-08", "Ago"],
    ];
    return months.map(([key, month], index) => {
      const fuel = data.fuelEntries
        .filter((entry) => entry.date.startsWith(key))
        .reduce((sum, entry) => sum + Number(entry.totalCost), 0);
      const maintenance = data.maintenanceEntries
        .filter((entry) => entry.date.startsWith(key))
        .reduce((sum, entry) => sum + Number(entry.cost), 0);
      const demoBase = [820000, 910000, 760000, 1080000, 1570000, 870000][index];
      return { month, combustível: fuel || demoBase, manutenção: maintenance || Math.round(demoBase * 0.42) };
    });
  }, [data.fuelEntries, data.maintenanceEntries]);

  const pieData = [
    { name: "Operacionais", value: activeVehicles, color: "#10b981" },
    { name: "Manutenção", value: data.vehicles.filter((v) => v.status === "maintenance").length, color: "#f59e0b" },
    { name: "Inactivas", value: data.vehicles.filter((v) => v.status === "inactive").length, color: "#94a3b8" },
  ];

  function changeView(nextView: View) {
    setView(nextView);
    setMobileMenu(false);
    setQuery("");
  }

  async function deleteItem(kind: "vehicles" | "fuel" | "maintenance" | "documents", id: string) {
    if (!window.confirm("Confirma a eliminação deste registo?")) return;
    const endpoint = kind === "vehicles" ? "vehicles" : kind;
    try {
      await requestJson(`/api/${endpoint}/${id}`, { method: "DELETE" });
      setData((current) => {
        if (kind === "vehicles") return { ...current, vehicles: current.vehicles.filter((item) => item.id !== id) };
        if (kind === "fuel") return { ...current, fuelEntries: current.fuelEntries.filter((item) => item.id !== id) };
        if (kind === "maintenance") return { ...current, maintenanceEntries: current.maintenanceEntries.filter((item) => item.id !== id) };
        return { ...current, documents: current.documents.filter((item) => item.id !== id) };
      });
      toast.success("Registo eliminado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível eliminar o registo.");
    }
  }

  async function setVehicleStatus(vehicle: VehicleRecord, status: VehicleRecord["status"]) {
    try {
      const updated = await requestJson<VehicleRecord>(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setData((current) => ({
        ...current,
        vehicles: current.vehicles.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      }));
      toast.success("Estado da viatura actualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível actualizar.");
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-18 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-blue-950/20">
          <CarFront className="size-5" />
        </div>
        <div>
          <p className="text-base font-semibold tracking-tight">FleetOps</p>
          <p className="text-[11px] text-sidebar-foreground/55">GESTÃO DE FROTA</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-sidebar-foreground/40">NAVEGAÇÃO</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => changeView(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                view === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/68 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-[18px]" />
              <span>{item.label}</span>
              {item.id === "documents" && expiringDocuments > 0 && (
                <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{expiringDocuments}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/70 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium"><ShieldCheck className="size-4 text-emerald-400" /> Sistema operacional</div>
        <p className="text-[11px] leading-4 text-sidebar-foreground/50">
          {data.isDemo ? "Modo demonstração activo" : "Base de dados Neon ligada"}
        </p>
      </div>
      <div className="flex items-center gap-3 border-t border-sidebar-border p-4">
        <div className="grid size-9 place-items-center rounded-full bg-sidebar-accent"><UserRound className="size-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">Administrador</p>
          <p className="truncate text-[10px] text-sidebar-foreground/45">Gestor de frota</p>
        </div>
        <Settings className="size-4 text-sidebar-foreground/45" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block" data-print-hidden>{sidebar}</aside>
      {mobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden" data-print-hidden>
          <button aria-label="Fechar menu" className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={() => setMobileMenu(false)} />
          <aside className="relative h-full w-72 shadow-2xl">{sidebar}<button aria-label="Fechar" onClick={() => setMobileMenu(false)} className="absolute right-3 top-3 rounded-lg p-2 text-sidebar-foreground/70"><X className="size-4" /></button></aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-18 items-center border-b bg-background/92 px-4 backdrop-blur-xl sm:px-6 lg:px-8" data-print-hidden>
          <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={() => setMobileMenu(true)}><Menu /></Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{viewTitles[view].title}</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">{viewTitles[view].subtitle}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" aria-label="Alternar tema" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Alertas" onClick={() => changeView("documents")}>
              <Bell />
              {expiringDocuments > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-background bg-rose-500" />}
            </Button>
            <Separator orientation="vertical" className="mx-1 h-7" />
            <div className="hidden items-center gap-2 sm:flex">
              <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary"><UserRound className="size-4" /></div>
              <div className="hidden xl:block"><p className="text-xs font-medium">Administrador</p><p className="text-[10px] text-muted-foreground">Conta principal</p></div>
            </div>
          </div>
        </header>

        {data.isDemo && (
          <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-center text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/35 dark:text-blue-300" data-print-hidden>
            Está a visualizar dados de demonstração. Ligue a base de dados Neon para guardar alterações.
          </div>
        )}

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {view === "dashboard" && (
            <Dashboard
              vehicles={data.vehicles}
              maintenanceEntries={data.maintenanceEntries}
              documents={data.documents}
              vehicleMap={vehicleMap}
              activeVehicles={activeVehicles}
              availability={availability}
              totalFuel={totalFuel}
              totalMaintenance={totalMaintenance}
              chartData={chartData}
              pieData={pieData}
              onNavigate={changeView}
              onAddVehicle={() => setVehicleDialog(true)}
            />
          )}
          {view === "vehicles" && (
            <VehiclesView
              vehicles={filteredVehicles}
              query={query}
              setQuery={setQuery}
              onAdd={() => setVehicleDialog(true)}
              onDelete={(id) => deleteItem("vehicles", id)}
              onStatus={setVehicleStatus}
            />
          )}
          {view === "fuel" && (
            <FuelView entries={filteredFuel} vehicleMap={vehicleMap} query={query} setQuery={setQuery} onAdd={() => setFuelDialog(true)} onDelete={(id) => deleteItem("fuel", id)} />
          )}
          {view === "maintenance" && (
            <MaintenanceView entries={filteredMaintenance} vehicleMap={vehicleMap} query={query} setQuery={setQuery} onAdd={() => setMaintenanceDialog(true)} onDelete={(id) => deleteItem("maintenance", id)} />
          )}
          {view === "documents" && (
            <DocumentsView documents={filteredDocuments} vehicleMap={vehicleMap} query={query} setQuery={setQuery} onAdd={() => setDocumentDialog(true)} onDelete={(id) => deleteItem("documents", id)} />
          )}
          {view === "reports" && <ReportsView data={data} vehicleMap={vehicleMap} />}
        </main>
      </div>

      <VehicleDialog open={vehicleDialog} setOpen={setVehicleDialog} onCreated={(vehicle) => setData((current) => ({ ...current, vehicles: [vehicle, ...current.vehicles] }))} />
      <FuelDialog open={fuelDialog} setOpen={setFuelDialog} vehicles={data.vehicles} onCreated={(entry) => setData((current) => ({ ...current, fuelEntries: [entry, ...current.fuelEntries] }))} />
      <MaintenanceDialog open={maintenanceDialog} setOpen={setMaintenanceDialog} vehicles={data.vehicles} onCreated={(entry) => setData((current) => ({ ...current, maintenanceEntries: [entry, ...current.maintenanceEntries] }))} />
      <DocumentDialog open={documentDialog} setOpen={setDocumentDialog} vehicles={data.vehicles} onCreated={(document) => setData((current) => ({ ...current, documents: [document, ...current.documents] }))} />
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div><p className="text-xs font-medium text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p></div>
          <div className={cn("grid size-10 place-items-center rounded-xl", accent)}><Icon className="size-5" /></div>
        </div>
        <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground"><TrendingUp className="size-3 text-emerald-500" />{detail}</p>
      </CardContent>
    </Card>
  );
}

function Dashboard({
  vehicles,
  maintenanceEntries,
  documents,
  vehicleMap,
  activeVehicles,
  availability,
  totalFuel,
  totalMaintenance,
  chartData,
  pieData,
  onNavigate,
  onAddVehicle,
}: {
  vehicles: VehicleRecord[];
  maintenanceEntries: MaintenanceRecord[];
  documents: DocumentRecord[];
  vehicleMap: Map<string, VehicleRecord>;
  activeVehicles: number;
  availability: number;
  totalFuel: number;
  totalMaintenance: number;
  chartData: Array<Record<string, string | number>>;
  pieData: Array<{ name: string; value: number; color: string }>;
  onNavigate: (view: View) => void;
  onAddVehicle: () => void;
}) {
  const alerts = documents
    .map((document) => ({ document, days: daysUntil(document.validUntil) }))
    .filter(({ days }) => days <= 45)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);
  const upcoming = maintenanceEntries
    .filter((entry) => entry.status !== "completed")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center" data-print-hidden>
        <div><p className="text-sm font-medium">Bom dia, Administrador</p><p className="text-xs text-muted-foreground">Aqui está o resumo da frota em 3 de Agosto de 2026.</p></div>
        <Button onClick={onAddVehicle}><Plus />Nova viatura</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total de viaturas" value={String(vehicles.length)} detail={`${activeVehicles} operacionais`} icon={CarFront} accent="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300" />
        <MetricCard title="Disponibilidade" value={`${availability}%`} detail="Meta mensal: 90%" icon={Gauge} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" />
        <MetricCard title="Custo combustível" value={formatCurrency(totalFuel)} detail="Registos do período" icon={Fuel} accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300" />
        <MetricCard title="Custo manutenção" value={formatCurrency(totalMaintenance)} detail="Inclui serviços agendados" icon={Wrench} accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div><CardTitle className="text-base">Evolução de custos</CardTitle><CardDescription>Combustível e manutenção nos últimos 6 meses</CardDescription></div>
            <Badge variant="outline">AOA</Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[285px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="maintenanceGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <ChartTooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="combustível" stroke="#3b82f6" strokeWidth={2.5} fill="url(#fuelGradient)" />
                  <Area type="monotone" dataKey="manutenção" stroke="#f59e0b" strokeWidth={2.5} fill="url(#maintenanceGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-blue-500" />Combustível</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-amber-500" />Manutenção</span></div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader><CardTitle className="text-base">Estado da frota</CardTitle><CardDescription>Distribuição operacional actual</CardDescription></CardHeader>
          <CardContent>
            <div className="relative h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={82} paddingAngle={4} stroke="none">{pieData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><ChartTooltip /></PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-2xl font-semibold">{availability}%</p><p className="text-[10px] text-muted-foreground">DISPONÍVEL</p></div></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {pieData.map((item) => <div key={item.name} className="rounded-lg bg-muted/50 p-2 text-center"><p className="text-lg font-semibold">{item.value}</p><p className="truncate text-[10px] text-muted-foreground">{item.name}</p></div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base">Próximas manutenções</CardTitle><CardDescription>Intervenções que exigem acompanhamento</CardDescription></div><Button variant="ghost" size="sm" onClick={() => onNavigate("maintenance")}>Ver todas<ChevronRight /></Button></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length ? upcoming.map((entry) => {
              const vehicle = vehicleMap.get(entry.vehicleId);
              return <div key={entry.id} className="flex items-center gap-3 rounded-xl border p-3"><div className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40"><Wrench className="size-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{entry.description}</p><p className="truncate text-xs text-muted-foreground">{vehicle?.registration} · {vehicleName(vehicle)}</p></div><div className="text-right"><p className="text-xs font-medium">{formatDate(entry.date)}</p><MaintenanceBadge status={entry.status} /></div></div>;
            }) : <EmptyState icon={Wrench} title="Sem manutenções pendentes" text="As novas intervenções aparecerão aqui." />}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2 text-base">Alertas de documentos{alerts.length > 0 && <Badge variant="destructive">{alerts.length}</Badge>}</CardTitle><CardDescription>Validades a expirar ou expiradas</CardDescription></div><Button variant="ghost" size="sm" onClick={() => onNavigate("documents")}>Ver todos<ChevronRight /></Button></CardHeader>
          <CardContent className="space-y-3">
            {alerts.length ? alerts.map(({ document, days }) => {
              const vehicle = vehicleMap.get(document.vehicleId);
              return <div key={document.id} className="flex items-center gap-3 rounded-xl border p-3"><div className={cn("grid size-9 place-items-center rounded-lg", days < 0 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600")}><AlertTriangle className="size-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{document.type}</p><p className="truncate text-xs text-muted-foreground">{vehicle?.registration} · {vehicleName(vehicle)}</p></div><div className="text-right"><p className={cn("text-xs font-semibold", days < 0 ? "text-rose-600" : "text-amber-600")}>{days < 0 ? `Expirou há ${Math.abs(days)} dias` : days === 0 ? "Expira hoje" : `${days} dias`}</p><p className="text-[10px] text-muted-foreground">{formatDate(document.validUntil)}</p></div></div>;
            }) : <EmptyState icon={ShieldCheck} title="Documentação em dia" text="Não existem validades críticas nos próximos 45 dias." />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ViewToolbar({ query, setQuery, button, icon: Icon = Plus }: { query: string; setQuery: (value: string) => void; button: { label: string; onClick: () => void }; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center" data-print-hidden>
      <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar..." className="pl-9" /></div>
      <Button onClick={button.onClick}><Icon />{button.label}</Button>
    </div>
  );
}

function VehiclesView({ vehicles, query, setQuery, onAdd, onDelete, onStatus }: {
  vehicles: VehicleRecord[];
  query: string;
  setQuery: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onStatus: (vehicle: VehicleRecord, status: VehicleRecord["status"]) => void;
}) {
  return (
    <div className="space-y-5">
      <ViewToolbar query={query} setQuery={setQuery} button={{ label: "Nova viatura", onClick: onAdd }} />
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
        <CardHeader className="border-b bg-muted/20 py-4"><CardTitle className="text-sm">Frota registada</CardTitle><CardDescription>{vehicles.length} viatura{vehicles.length === 1 ? "" : "s"} encontrada{vehicles.length === 1 ? "" : "s"}</CardDescription></CardHeader>
        <CardContent className="p-0">
          {vehicles.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="bg-muted/30"><TableHead>Viatura</TableHead><TableHead>Matrícula</TableHead><TableHead>Condutor</TableHead><TableHead>Centro de custo</TableHead><TableHead>Quilometragem</TableHead><TableHead>Estado</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} className="group">
                      <TableCell><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40"><CarFront className="size-4" /></div><div><p className="font-medium">{vehicle.brand} {vehicle.model}</p><p className="text-xs text-muted-foreground">{vehicle.year} · {vehicle.type}</p></div></div></TableCell>
                      <TableCell><span className="rounded-md border bg-muted/30 px-2 py-1 font-mono text-xs font-semibold">{vehicle.registration}</span></TableCell>
                      <TableCell><div className="flex items-center gap-2"><UserRound className="size-3.5 text-muted-foreground" /><span className="text-sm">{vehicle.driver ?? "Não atribuído"}</span></div></TableCell>
                      <TableCell><Badge variant="secondary">{vehicle.costCenter}</Badge></TableCell>
                      <TableCell className="font-medium">{numberFormatter.format(vehicle.mileage)} km</TableCell>
                      <TableCell><StatusBadge status={vehicle.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acções" />}><MoreHorizontal /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => onStatus(vehicle, "active")}><ClipboardCheck />Marcar operacional</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatus(vehicle, "maintenance")}><Wrench />Em manutenção</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatus(vehicle, "inactive")}><CalendarClock />Marcar inactiva</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => onDelete(vehicle.id)}><Trash2 />Eliminar viatura</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : <div className="p-6"><EmptyState icon={CarFront} title="Nenhuma viatura encontrada" text="Ajuste a pesquisa ou adicione uma nova viatura à frota." /></div>}
        </CardContent>
      </Card>
    </div>
  );
}

function FuelView({ entries, vehicleMap, query, setQuery, onAdd, onDelete }: {
  entries: FuelRecord[];
  vehicleMap: Map<string, VehicleRecord>;
  query: string;
  setQuery: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const liters = entries.reduce((sum, entry) => sum + Number(entry.liters), 0);
  const cost = entries.reduce((sum, entry) => sum + Number(entry.totalCost), 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total registado" value={`${numberFormatter.format(Math.round(liters))} L`} detail={`${entries.length} abastecimentos`} icon={Droplets} accent="bg-blue-50 text-blue-600" />
        <MetricCard title="Custo total" value={formatCurrency(cost)} detail="No período apresentado" icon={CircleDollarSign} accent="bg-violet-50 text-violet-600" />
        <MetricCard title="Custo médio/litro" value={formatCurrency(liters ? cost / liters : 0)} detail="Média ponderada" icon={Gauge} accent="bg-emerald-50 text-emerald-600" />
      </div>
      <ViewToolbar query={query} setQuery={setQuery} button={{ label: "Novo abastecimento", onClick: onAdd }} icon={Fuel} />
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70"><CardContent className="p-0">
        {entries.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-muted/30"><TableHead>Data</TableHead><TableHead>Viatura</TableHead><TableHead>Fornecedor</TableHead><TableHead>Litros</TableHead><TableHead>Quilometragem</TableHead><TableHead>Custo</TableHead><TableHead>Factura</TableHead><TableHead /></TableRow></TableHeader><TableBody>
          {entries.map((entry) => { const vehicle = vehicleMap.get(entry.vehicleId); return <TableRow key={entry.id}><TableCell>{formatDate(entry.date)}</TableCell><TableCell><p className="font-medium">{vehicle?.registration ?? "—"}</p><p className="text-xs text-muted-foreground">{vehicleName(vehicle)}</p></TableCell><TableCell>{entry.supplier ?? "—"}</TableCell><TableCell className="font-medium">{Number(entry.liters).toLocaleString("pt-PT")} L</TableCell><TableCell>{numberFormatter.format(entry.mileage)} km</TableCell><TableCell className="font-semibold">{formatCurrency(entry.totalCost)}</TableCell><TableCell><Badge variant="outline">{entry.invoiceNumber ?? "S/ ref."}</Badge></TableCell><TableCell><Button variant="ghost" size="icon-sm" onClick={() => onDelete(entry.id)} aria-label="Eliminar"><Trash2 /></Button></TableCell></TableRow>; })}
        </TableBody></Table></div> : <div className="p-6"><EmptyState icon={Fuel} title="Sem abastecimentos" text="Registe o primeiro abastecimento da frota." /></div>}
      </CardContent></Card>
    </div>
  );
}

function MaintenanceView({ entries, vehicleMap, query, setQuery, onAdd, onDelete }: {
  entries: MaintenanceRecord[];
  vehicleMap: Map<string, VehicleRecord>;
  query: string;
  setQuery: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <ViewToolbar query={query} setQuery={setQuery} button={{ label: "Nova manutenção", onClick: onAdd }} icon={Wrench} />
      <div className="grid gap-4 md:grid-cols-3">
        {(["scheduled", "in_progress", "completed"] as const).map((status) => {
          const list = entries.filter((entry) => entry.status === status);
          const labels = { scheduled: "Agendadas", in_progress: "Em curso", completed: "Concluídas" };
          const icons = { scheduled: CalendarClock, in_progress: Wrench, completed: ClipboardCheck };
          const Icon = icons[status];
          return <Card key={status} className="border-0 shadow-sm ring-1 ring-border/70"><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted-foreground">{labels[status]}</p><p className="mt-1 text-2xl font-semibold">{list.length}</p><p className="text-[11px] text-muted-foreground">{formatCurrency(list.reduce((sum, entry) => sum + Number(entry.cost), 0))}</p></div><div className="grid size-10 place-items-center rounded-xl bg-muted"><Icon className="size-5" /></div></CardContent></Card>;
        })}
      </div>
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70"><CardContent className="p-0">
        {entries.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-muted/30"><TableHead>Data</TableHead><TableHead>Viatura</TableHead><TableHead>Intervenção</TableHead><TableHead>Fornecedor</TableHead><TableHead>Custo</TableHead><TableHead>Estado</TableHead><TableHead /></TableRow></TableHeader><TableBody>
          {entries.map((entry) => { const vehicle = vehicleMap.get(entry.vehicleId); return <TableRow key={entry.id}><TableCell>{formatDate(entry.date)}</TableCell><TableCell><p className="font-medium">{vehicle?.registration ?? "—"}</p><p className="text-xs text-muted-foreground">{vehicleName(vehicle)}</p></TableCell><TableCell><p className="max-w-xs font-medium">{entry.description}</p>{entry.nextDate && <p className="text-xs text-muted-foreground">Próxima: {formatDate(entry.nextDate)}</p>}</TableCell><TableCell>{entry.supplier ?? "—"}</TableCell><TableCell className="font-semibold">{formatCurrency(entry.cost)}</TableCell><TableCell><MaintenanceBadge status={entry.status} /></TableCell><TableCell><Button variant="ghost" size="icon-sm" onClick={() => onDelete(entry.id)} aria-label="Eliminar"><Trash2 /></Button></TableCell></TableRow>; })}
        </TableBody></Table></div> : <div className="p-6"><EmptyState icon={Wrench} title="Sem manutenções" text="Crie uma intervenção preventiva ou correctiva." /></div>}
      </CardContent></Card>
    </div>
  );
}

function DocumentsView({ documents, vehicleMap, query, setQuery, onAdd, onDelete }: {
  documents: DocumentRecord[];
  vehicleMap: Map<string, VehicleRecord>;
  query: string;
  setQuery: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const valid = documents.filter((document) => daysUntil(document.validUntil) > 45).length;
  const warning = documents.filter((document) => daysUntil(document.validUntil) >= 0 && daysUntil(document.validUntil) <= 45).length;
  const expired = documents.filter((document) => daysUntil(document.validUntil) < 0).length;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3"><MetricCard title="Documentos válidos" value={String(valid)} detail="Sem acção necessária" icon={ShieldCheck} accent="bg-emerald-50 text-emerald-600" /><MetricCard title="A expirar" value={String(warning)} detail="Nos próximos 45 dias" icon={CalendarClock} accent="bg-amber-50 text-amber-600" /><MetricCard title="Expirados" value={String(expired)} detail="Acção imediata" icon={AlertTriangle} accent="bg-rose-50 text-rose-600" /></div>
      <ViewToolbar query={query} setQuery={setQuery} button={{ label: "Novo documento", onClick: onAdd }} icon={FileText} />
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70"><CardContent className="p-0">
        {documents.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-muted/30"><TableHead>Documento</TableHead><TableHead>Viatura</TableHead><TableHead>Referência</TableHead><TableHead>Validade</TableHead><TableHead>Estado</TableHead><TableHead /></TableRow></TableHeader><TableBody>
          {documents.sort((a, b) => a.validUntil.localeCompare(b.validUntil)).map((document) => { const vehicle = vehicleMap.get(document.vehicleId); const days = daysUntil(document.validUntil); return <TableRow key={document.id}><TableCell><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><FileText className="size-4" /></div><span className="font-medium">{document.type}</span></div></TableCell><TableCell><p className="font-medium">{vehicle?.registration ?? "—"}</p><p className="text-xs text-muted-foreground">{vehicleName(vehicle)}</p></TableCell><TableCell className="font-mono text-xs">{document.reference ?? "—"}</TableCell><TableCell>{formatDate(document.validUntil)}</TableCell><TableCell>{days < 0 ? <Badge variant="destructive">Expirado</Badge> : days <= 45 ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{days} dias</Badge> : <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Válido</Badge>}</TableCell><TableCell><Button variant="ghost" size="icon-sm" onClick={() => onDelete(document.id)} aria-label="Eliminar"><Trash2 /></Button></TableCell></TableRow>; })}
        </TableBody></Table></div> : <div className="p-6"><EmptyState icon={FileCheck2} title="Sem documentos" text="Adicione seguros, livretes e inspecções da frota." /></div>}
      </CardContent></Card>
    </div>
  );
}

function ReportsView({ data, vehicleMap }: { data: FleetData; vehicleMap: Map<string, VehicleRecord> }) {
  const centerRows = useMemo(() => {
    const centers = new Map<string, { vehicles: number; fuel: number; maintenance: number }>();
    data.vehicles.forEach((vehicle) => centers.set(vehicle.costCenter, { vehicles: (centers.get(vehicle.costCenter)?.vehicles ?? 0) + 1, fuel: centers.get(vehicle.costCenter)?.fuel ?? 0, maintenance: centers.get(vehicle.costCenter)?.maintenance ?? 0 }));
    data.fuelEntries.forEach((entry) => { const center = vehicleMap.get(entry.vehicleId)?.costCenter ?? "Sem CC"; const row = centers.get(center) ?? { vehicles: 0, fuel: 0, maintenance: 0 }; row.fuel += Number(entry.totalCost); centers.set(center, row); });
    data.maintenanceEntries.forEach((entry) => { const center = vehicleMap.get(entry.vehicleId)?.costCenter ?? "Sem CC"; const row = centers.get(center) ?? { vehicles: 0, fuel: 0, maintenance: 0 }; row.maintenance += Number(entry.cost); centers.set(center, row); });
    return [...centers.entries()].map(([center, values]) => ({ center, ...values, total: values.fuel + values.maintenance })).sort((a, b) => b.total - a.total);
  }, [data, vehicleMap]);

  function exportCsv() {
    const rows = [
      ["Centro de custo", "Viaturas", "Combustível (Kz)", "Manutenção (Kz)", "Total (Kz)"],
      ...centerRows.map((row) => [row.center, row.vehicles, row.fuel, row.maintenance, row.total]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    link.download = "relatorio-frota.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const total = centerRows.reduce((sum, row) => sum + row.total, 0);
  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-2" data-print-hidden><Button variant="outline" onClick={exportCsv}><Download />Exportar CSV</Button><Button onClick={() => window.print()}><Printer />Imprimir relatório</Button></div>
      <Card className="border-0 shadow-sm ring-1 ring-border/70">
        <CardHeader className="border-b"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><CardTitle className="text-xl">Relatório consolidado da frota</CardTitle><CardDescription>Resumo de custos por centro de custo · Agosto 2026</CardDescription></div><div className="text-left sm:text-right"><p className="text-xs text-muted-foreground">Custo total analisado</p><p className="text-xl font-semibold">{formatCurrency(total)}</p></div></div></CardHeader>
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Viaturas</p><p className="mt-1 text-2xl font-semibold">{data.vehicles.length}</p></div>
            <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Centros de custo</p><p className="mt-1 text-2xl font-semibold">{centerRows.length}</p></div>
            <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Combustível</p><p className="mt-1 text-xl font-semibold">{formatCurrency(data.fuelEntries.reduce((s, e) => s + Number(e.totalCost), 0))}</p></div>
            <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Manutenção</p><p className="mt-1 text-xl font-semibold">{formatCurrency(data.maintenanceEntries.reduce((s, e) => s + Number(e.cost), 0))}</p></div>
          </div>
          <div className="overflow-x-auto rounded-xl border"><Table><TableHeader><TableRow className="bg-muted/40"><TableHead>Centro de custo</TableHead><TableHead>Viaturas</TableHead><TableHead>Combustível</TableHead><TableHead>Manutenção</TableHead><TableHead>Total</TableHead><TableHead className="w-[24%]">Peso no custo</TableHead></TableRow></TableHeader><TableBody>{centerRows.map((row) => <TableRow key={row.center}><TableCell><Badge variant="secondary">{row.center}</Badge></TableCell><TableCell>{row.vehicles}</TableCell><TableCell>{formatCurrency(row.fuel)}</TableCell><TableCell>{formatCurrency(row.maintenance)}</TableCell><TableCell className="font-semibold">{formatCurrency(row.total)}</TableCell><TableCell><div className="flex items-center gap-3"><Progress value={total ? (row.total / total) * 100 : 0} className="h-2" /><span className="w-10 text-right text-xs text-muted-foreground">{total ? Math.round((row.total / total) * 100) : 0}%</span></div></TableCell></TableRow>)}</TableBody></Table></div>
          <p className="text-[11px] text-muted-foreground">Relatório gerado automaticamente pelo FleetOps. Os valores apresentados reflectem os registos existentes na plataforma.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FormField({ label, name, type = "text", required, placeholder, defaultValue }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string | number }) {
  return <div className="space-y-1.5"><Label htmlFor={name}>{label}{required && <span className="ml-0.5 text-destructive">*</span>}</Label><Input id={name} name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue} /></div>;
}

function VehicleDialog({ open, setOpen, onCreated }: { open: boolean; setOpen: (open: boolean) => void; onCreated: (vehicle: VehicleRecord) => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const vehicle = await requestJson<VehicleRecord>("/api/vehicles", { method: "POST", body: JSON.stringify({
        registration: getValue(form, "registration"), brand: getValue(form, "brand"), model: getValue(form, "model"), year: getValue(form, "year"), type: getValue(form, "type"), fuelType: getValue(form, "fuelType"), status: "active", driver: getValue(form, "driver"), costCenter: getValue(form, "costCenter"), mileage: getValue(form, "mileage"), acquisitionDate: getValue(form, "acquisitionDate"), acquisitionValue: getValue(form, "acquisitionValue") || null, insuranceValidUntil: getValue(form, "insuranceValidUntil"), inspectionValidUntil: getValue(form, "inspectionValidUntil"), color: getValue(form, "color"), notes: getValue(form, "notes"),
      }) });
      onCreated(vehicle); setOpen(false); toast.success("Viatura adicionada com sucesso.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível adicionar a viatura."); } finally { setSaving(false); }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><form onSubmit={submit}><DialogHeader><DialogTitle>Adicionar nova viatura</DialogTitle><DialogDescription>Preencha os dados de identificação, atribuição e validade.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><FormField label="Matrícula" name="registration" required placeholder="LD-00-00-AA" /><FormField label="Marca" name="brand" required placeholder="Toyota" /><FormField label="Modelo" name="model" required placeholder="Hilux 2.8 GD-6" /><FormField label="Ano" name="year" type="number" required defaultValue={2026} /><div className="space-y-1.5"><Label htmlFor="type">Tipo *</Label><select id="type" name="type" required className={selectClass}><option value="Pick-up">Pick-up</option><option value="SUV">SUV</option><option value="Ligeiro">Ligeiro</option><option value="Minibus">Minibus</option><option value="Autocarro">Autocarro</option><option value="Camião">Camião</option></select></div><div className="space-y-1.5"><Label htmlFor="fuelType">Combustível *</Label><select id="fuelType" name="fuelType" required className={selectClass}><option value="diesel">Gasóleo</option><option value="gasoline">Gasolina</option><option value="hybrid">Híbrido</option><option value="electric">Eléctrico</option></select></div><FormField label="Condutor" name="driver" placeholder="Nome do condutor" /><FormField label="Centro de custo" name="costCenter" required defaultValue="CC 10" /><FormField label="Quilometragem" name="mileage" type="number" required defaultValue={0} /><FormField label="Cor" name="color" placeholder="Branco" /><FormField label="Data de aquisição" name="acquisitionDate" type="date" /><FormField label="Valor de aquisição (Kz)" name="acquisitionValue" type="number" /><FormField label="Seguro válido até" name="insuranceValidUntil" type="date" /><FormField label="Inspecção válida até" name="inspectionValidUntil" type="date" /><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="notes">Observações</Label><Textarea id="notes" name="notes" placeholder="Informação adicional sobre a viatura..." /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "A guardar..." : "Guardar viatura"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function VehicleSelect({ vehicles }: { vehicles: VehicleRecord[] }) {
  return <div className="space-y-1.5"><Label htmlFor="vehicleId">Viatura *</Label><select id="vehicleId" name="vehicleId" required className={selectClass}><option value="">Seleccionar viatura</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registration} · {vehicle.brand} {vehicle.model}</option>)}</select></div>;
}

function FuelDialog({ open, setOpen, vehicles, onCreated }: { open: boolean; setOpen: (open: boolean) => void; vehicles: VehicleRecord[]; onCreated: (entry: FuelRecord) => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget);
    try {
      const entry = await requestJson<FuelRecord>("/api/fuel", { method: "POST", body: JSON.stringify({ vehicleId: getValue(form, "vehicleId"), date: getValue(form, "date"), liters: getValue(form, "liters"), totalCost: getValue(form, "totalCost"), mileage: getValue(form, "mileage"), supplier: getValue(form, "supplier"), invoiceNumber: getValue(form, "invoiceNumber") }) });
      onCreated(entry); setOpen(false); toast.success("Abastecimento registado.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível guardar."); } finally { setSaving(false); }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><form onSubmit={submit}><DialogHeader><DialogTitle>Novo abastecimento</DialogTitle><DialogDescription>Registe o consumo e actualize a quilometragem da viatura.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><div className="sm:col-span-2"><VehicleSelect vehicles={vehicles} /></div><FormField label="Data" name="date" type="date" required defaultValue="2026-08-03" /><FormField label="Litros" name="liters" type="number" required placeholder="0,00" /><FormField label="Custo total (Kz)" name="totalCost" type="number" required placeholder="0" /><FormField label="Quilometragem" name="mileage" type="number" required placeholder="0" /><FormField label="Fornecedor" name="supplier" placeholder="Posto de combustível" /><FormField label="N.º da factura" name="invoiceNumber" placeholder="FT 00000" /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "A guardar..." : "Guardar abastecimento"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function MaintenanceDialog({ open, setOpen, vehicles, onCreated }: { open: boolean; setOpen: (open: boolean) => void; vehicles: VehicleRecord[]; onCreated: (entry: MaintenanceRecord) => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget);
    try {
      const entry = await requestJson<MaintenanceRecord>("/api/maintenance", { method: "POST", body: JSON.stringify({ vehicleId: getValue(form, "vehicleId"), date: getValue(form, "date"), nextDate: getValue(form, "nextDate"), description: getValue(form, "description"), supplier: getValue(form, "supplier"), cost: getValue(form, "cost"), mileage: getValue(form, "mileage") || null, status: getValue(form, "status"), notes: getValue(form, "notes") }) });
      onCreated(entry); setOpen(false); toast.success("Manutenção registada.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível guardar."); } finally { setSaving(false); }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><form onSubmit={submit}><DialogHeader><DialogTitle>Nova manutenção</DialogTitle><DialogDescription>Agende ou registe uma intervenção efectuada.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><div className="sm:col-span-2"><VehicleSelect vehicles={vehicles} /></div><FormField label="Data" name="date" type="date" required defaultValue="2026-08-03" /><FormField label="Próxima revisão" name="nextDate" type="date" /><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="description">Intervenção *</Label><Input id="description" name="description" required placeholder="Ex.: Revisão periódica e mudança de óleo" /></div><FormField label="Fornecedor" name="supplier" placeholder="Oficina / prestador" /><FormField label="Custo (Kz)" name="cost" type="number" required defaultValue={0} /><FormField label="Quilometragem" name="mileage" type="number" /><div className="space-y-1.5"><Label htmlFor="status">Estado *</Label><select id="status" name="status" required className={selectClass}><option value="scheduled">Agendada</option><option value="in_progress">Em curso</option><option value="completed">Concluída</option></select></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="maintenanceNotes">Observações</Label><Textarea id="maintenanceNotes" name="notes" placeholder="Peças, diagnóstico ou indicação adicional..." /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "A guardar..." : "Guardar manutenção"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function DocumentDialog({ open, setOpen, vehicles, onCreated }: { open: boolean; setOpen: (open: boolean) => void; vehicles: VehicleRecord[]; onCreated: (document: DocumentRecord) => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget);
    try {
      const document = await requestJson<DocumentRecord>("/api/documents", { method: "POST", body: JSON.stringify({ vehicleId: getValue(form, "vehicleId"), type: getValue(form, "type"), reference: getValue(form, "reference"), validUntil: getValue(form, "validUntil"), fileUrl: getValue(form, "fileUrl"), notes: getValue(form, "notes") }) });
      onCreated(document); setOpen(false); toast.success("Documento registado.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível guardar."); } finally { setSaving(false); }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><form onSubmit={submit}><DialogHeader><DialogTitle>Novo documento</DialogTitle><DialogDescription>Associe uma validade legal à viatura para activar os alertas.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><div className="sm:col-span-2"><VehicleSelect vehicles={vehicles} /></div><div className="space-y-1.5"><Label htmlFor="documentType">Tipo *</Label><select id="documentType" name="type" required className={selectClass}><option value="Seguro automóvel">Seguro automóvel</option><option value="Inspecção periódica">Inspecção periódica</option><option value="Livrete">Livrete</option><option value="Licença de circulação">Licença de circulação</option><option value="Outro">Outro</option></select></div><FormField label="Referência" name="reference" placeholder="N.º da apólice/documento" /><FormField label="Válido até" name="validUntil" type="date" required /><FormField label="Ligação para ficheiro" name="fileUrl" type="url" placeholder="https://..." /><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="documentNotes">Observações</Label><Textarea id="documentNotes" name="notes" placeholder="Informação adicional..." /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "A guardar..." : "Guardar documento"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
