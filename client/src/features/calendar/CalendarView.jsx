import { useState, useCallback, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../../lib/supabase';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    // Fetch all tasks that have a deadline
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*, projects(name)')
      .not('deadline', 'is', null);

    if (error) {
      console.error(error);
    } else {
      const calendarEvents = (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        start: new Date(task.deadline),
        end: new Date(task.deadline), // For now, single day events
        allDay: true,
        resource: task,
      }));
      setEvents(calendarEvents);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onEventDrop = async ({ event, start, end }) => {
    // Update local state optimistic
    const updatedEvents = events.map(existingEvent => {
      return existingEvent.id === event.id
        ? { ...existingEvent, start, end }
        : existingEvent;
    });
    setEvents(updatedEvents);

    // Update DB
    const { error } = await supabase
      .from('tasks')
      .update({ deadline: start.toISOString() }) // Assuming deadline is timestampz
      .eq('id', event.id);

    if (error) {
        console.error('Error updating deadline:', error);
        fetchEvents(); // Revert on error
    }
  };

  const eventStyleGetter = (event) => {
    const priorityColors = {
        low: '#3b82f6', // blue-500
        medium: '#eab308', // yellow-500
        high: '#f97316', // orange-500
        critical: '#ef4444', // red-500
    };
    
    // Default to medium if no priority or unknown
    const backgroundColor = priorityColors[event.resource?.priority] || '#6b7280';

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.8rem',
      },
    };
  };

  if (loading) return <div className="p-10 text-center">Cargando calendario...</div>;

  return (
    <div className="h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onEventDrop={onEventDrop}
        resizable={false} // Tasks are usually milestones/deadlines, not durations for now
        style={{ height: '100%' }}
        culture='es'
        messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
        }}
        eventPropGetter={eventStyleGetter}
        components={{
            event: ({ event }) => (
                <div title={`${event.title} - ${event.resource?.projects?.name || 'Sin proyecto'}`}>
                    <div className="font-semibold truncate">{event.title}</div>
                    {event.resource?.projects?.name && (
                        <div className="text-[10px] opacity-75 truncate">{event.resource.projects.name}</div>
                    )}
                </div>
            )
        }}
      />
    </div>
  );
}
