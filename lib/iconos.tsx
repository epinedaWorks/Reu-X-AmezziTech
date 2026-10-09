import {
  CalendarDays, ChartColumn, CircleCheck, CircleHelp, DollarSign, FileText, Flag, Handshake, Laptop,
  Lightbulb, MessagesSquare, Settings, Target, TrendingUp, TriangleAlert, Users, type LucideIcon,
} from "lucide-react";
import type { Icono } from "./esquemas";

export const ICONO_COMPONENTE: Record<Icono, LucideIcon> = {
  objetivo: Target,
  personas: Users,
  idea: Lightbulb,
  acuerdo: Handshake,
  tarea: CircleCheck,
  fecha: CalendarDays,
  dinero: DollarSign,
  alerta: TriangleAlert,
  tecnologia: Laptop,
  datos: ChartColumn,
  crecimiento: TrendingUp,
  pregunta: CircleHelp,
  proceso: Settings,
  comunicacion: MessagesSquare,
  documento: FileText,
  meta: Flag,
};

export function IconoReuX({ nombre, ...props }: { nombre: Icono } & React.ComponentProps<LucideIcon>) {
  const C = ICONO_COMPONENTE[nombre] ?? Lightbulb;
  return <C {...props} />;
}
