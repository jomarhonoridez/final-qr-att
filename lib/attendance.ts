import { supabase } from './supabase';

export interface AttendanceRecord {
  id: string | number;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
}

export interface AttendeeLog {
  studentId: string;
  scannedAt: string;
}

export interface TeacherEventAttendance {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string;
  endTime?: string;
  attendeeCount: number;
  attendees: AttendeeLog[];
}

/* ---------------- REGISTER ATTENDANCE ---------------- */
export async function registerAttendance(eventCode: string, studentId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('event_code', eventCode)
      .single();

    if (eventError || !event) {
      return { success: false, message: 'Invalid event or QR code.' };
    }

    const { data: existing, error: checkError } = await supabase
      .from('attendance')
      .select('*')
      .eq('event_id', event.id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) {
      return { success: false, message: 'Attendance already recorded for this event.' };
    }

    const { error: insertError } = await supabase
      .from('attendance')
      .insert([
        {
          event_id: event.id,
          student_id: studentId,
          scanned_at: new Date().toISOString(),
        },
      ]);

    if (insertError) throw insertError;

    return { success: true, message: `Successfully registered for ${event.title}!` };
  } catch (error: any) {
    console.error('Error logging attendance:', error);
    return { success: false, message: error?.message || 'Failed to record attendance.' };
  }
}

/* ---------------- STUDENT HISTORY ---------------- */
export async function getAttendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
          const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        event_id,
        scanned_at,
        events!fk_event (
          title
        )
      `)
      .eq('student_id', studentId)
      .order('scanned_at', { ascending: false });


  if (error) throw error;
  if (!data) return [];

  return data.map((record: any) => ({
    id: record.id,
    eventId: record.event_id,
    eventTitle: record.events?.title || 'Unknown Event',
    scannedAt: record.scanned_at,
  }));
}

/* ---------------- TEACHER HISTORY ---------------- */
export async function getTeacherEventAttendance(teacherId: string): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title, start_time, end_time')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError || !events) {
    console.error('Error loading teacher events:', eventError);
    return [];
  }

  const results: TeacherEventAttendance[] = [];

  for (const event of events) {
    const { data: scans, error: scanError } = await supabase
      .from('attendance')
      .select('student_id, scanned_at')
      .eq('event_id', event.id);

    if (scanError) {
      console.error('Error fetching event attendees:', scanError);
      continue;
    }

    const attendees: AttendeeLog[] = [];

    for (const scan of (scans || [])) {
      let displayName = scan.student_id;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', scan.student_id) // Match against 'id' as declared in your schema configuration!
          .maybeSingle();

        if (profile?.full_name) {
          displayName = profile.full_name;
        }
      } catch (err) {
        console.error('Profile query failed:', err);
      }

      attendees.push({
        studentId: displayName,
        scannedAt: scan.scanned_at,
      });
    }

    results.push({
      eventId: String(event.id),
      eventCode: event.event_code || String(event.id),
      title: event.title,
      startTime: event.start_time,
      endTime: event.end_time || undefined,
      attendeeCount: attendees.length,
      attendees: attendees,
    });
  }

  return results;
}
