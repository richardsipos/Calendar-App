import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./components/Card.jsx";
import { Button } from "./components/Button.jsx";
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from "firebase/firestore";

const times = Array.from({ length: 32 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const userColors = [
  "#B5A896",
  "#A8B5A0",
  "#E07A5F",
  "#D8B4A0",
  "#6B705C",
  "#CB997E",
  "#C08497",
];

export default function CalendarApp() {
  const [user, setUser] = useState(localStorage.getItem("calendarUser") || "");
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);

  // dragging (desktop)
  const [dragging, setDragging] = useState(null);

  // click (mobile)
  const [startSlot, setStartSlot] = useState(null);
  const [endSlot, setEndSlot] = useState(null);

  const [description, setDescription] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // Calculate current week's dates (Mon start)
  const today = new Date();
  const startOfWeek = new Date(today);
  const jsDay = today.getDay();
  const offsetToMonday = jsDay === 0 ? 6 : jsDay - 1;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(today.getDate() - offsetToMonday);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // 🔹 Sync users
  useEffect(() => {
    const q = query(collection(db, "Users"));
    const unsub = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map((doc) => doc.data().name));
    });
    return () => unsub();
  }, []);

  // 🔹 Sync reservations
  useEffect(() => {
    const q = query(collection(db, "Reservations"));
    const unsub = onSnapshot(q, (snapshot) => {
      setReservations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const saveUser = async () => {
    if (user.trim() && !users.includes(user)) {
      await addDoc(collection(db, "Users"), { name: user });
      localStorage.setItem("calendarUser", user);
    }
  };

  const getUserColor = (name) => {
    const idx = users.indexOf(name);
    return userColors[idx % userColors.length] || "#9CA3AF";
  };

  // 🖱️ Drag start
  const handleMouseDown = (day, slot) => {
    if (!user.trim()) return;
    const mine = reservations.find(
      (r) => r.user === user && r.day === day && slot >= r.start && slot <= r.end
    );
    if (mine) {
      deleteDoc(doc(db, "Reservations", mine.id));
      return;
    }
    setDragging({ day, start: slot, end: slot });
  };

  // 🖱️ Drag move
  const handleMouseEnter = (day, slot) => {
    if (!dragging) return;
    if (dragging.day !== day) return;
    setDragging({ ...dragging, end: slot });
  };

  // 🖱️ Drag end
  const handleMouseUp = () => {
    if (!dragging) return;
    setStartSlot({ day: dragging.day, slot: Math.min(dragging.start, dragging.end) });
    setEndSlot(Math.max(dragging.start, dragging.end));
    setShowPopup(true);
  };

  // 📱 Click mode
  const handleSlotClick = (day, slot) => {
    if (!user.trim()) return;
    const mine = reservations.find(
      (r) => r.user === user && r.day === day && slot >= r.start && slot <= r.end
    );
    if (mine) {
      deleteDoc(doc(db, "Reservations", mine.id));
      return;
    }
    setStartSlot({ day, slot });
    setEndSlot(slot);
    setShowPopup(true);
  };

  // Confirm save
  const confirmReservation = async () => {
    if (!startSlot || !user.trim() || !description.trim()) {
      setShowPopup(false);
      return;
    }
    const newRes = {
      day: startSlot.day,
      start: Math.min(startSlot.slot, endSlot),
      end: Math.max(startSlot.slot, endSlot),
      user,
      description,
    };
    await addDoc(collection(db, "Reservations"), newRes);
    setDescription("");
    setStartSlot(null);
    setEndSlot(null);
    setDragging(null);
    setShowPopup(false);
  };

  const getReservationsForSlot = (day, slot) =>
    reservations.filter((r) => r.day === day && slot >= r.start && slot <= r.end);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAF8] min-h-screen">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#4A4A4A] mb-6 sm:mb-8 tracking-wide text-center lg:text-left">
        📅 Shared Weekly Calendar
      </h1>

      {/* User select */}
      <div className="mb-6 flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
        <select
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none text-sm sm:text-base"
        >
          <option value="">Select user</option>
          {users.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="New user"
          onChange={(e) => setUser(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none text-sm sm:text-base"
        />
        <Button
          className="w-full sm:w-auto bg-[#A8B5A0] hover:bg-[#8E9E84] text-white px-4 py-2 rounded-lg shadow text-sm sm:text-base"
          onClick={saveUser}
        >
          Save User
        </Button>
      </div>

      {/* Calendar Grid - responsive scroll */}
      <div className="overflow-x-auto">
        <div
          className="grid grid-cols-[80px_repeat(7,minmax(100px,1fr))] lg:grid-cols-8 border border-[#E0DED9] rounded-2xl shadow select-none bg-white text-xs sm:text-sm"
          onMouseUp={handleMouseUp}
        >
          {/* Header row */}
          <div className="bg-[#F5F3F0] p-2 text-center font-serif font-semibold text-[#4A4A4A]">
            Time
          </div>
          {days.map((day, i) => (
            <div key={day} className="bg-[#F5F3F0] p-2 text-center font-serif font-semibold text-[#4A4A4A]">
              <div>{day}</div>
              <div className="text-[10px] sm:text-xs text-[#6B705C]">
                {weekDates[i].toLocaleString("default", { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}

          {/* Timeslots */}
          {times.map((time, idx) => (
            <React.Fragment key={time}>
              <div className="border-t border-[#E0DED9] p-2 text-[10px] sm:text-xs lg:text-sm bg-[#FAFAF8] text-[#4A4A4A] font-light">
                {time}
              </div>
              {days.map((day) => {
                const slotReservations = getReservationsForSlot(day, idx);
                const isDragging =
                  dragging &&
                  dragging.day === day &&
                  idx >= Math.min(dragging.start, dragging.end) &&
                  idx <= Math.max(dragging.start, dragging.end);

                return (
                  <div
                    key={day + idx}
                    className={`border-t border-l border-[#E0DED9] h-10 sm:h-12 cursor-pointer transition-colors duration-200 flex items-stretch justify-center text-[10px] sm:text-xs lg:text-sm rounded-sm ${
                      slotReservations.length > 0 || isDragging ? "text-white" : "hover:bg-[#E9ECE7]"
                    }`}
                    onMouseDown={(e) => {
                      if (e.pointerType !== "touch") handleMouseDown(day, idx); // only desktop
                    }}
                    onMouseEnter={(e) => {
                      if (e.pointerType !== "touch") handleMouseEnter(day, idx);
                    }}
                    onMouseUp={(e) => {
                      if (e.pointerType !== "touch") handleMouseUp();
                    }}
                    onClick={(e) => {
                      if (e.pointerType === "touch") handleSlotClick(day, idx); // only phones
                    }}
                  >
                    {slotReservations.length > 0 ? (
                      slotReservations.map((r) => (
                        <div
                          key={r.id}
                          className="flex-1 flex items-center justify-center overflow-hidden px-1"
                          style={{
                            backgroundColor: getUserColor(r.user),
                            opacity: 0.9,
                          }}
                        >
                          {idx === r.start ? r.user : r.description}
                        </div>
                      ))
                    ) : isDragging ? (
                      <div className="flex-1 flex items-center justify-center bg-[#A8B5A0] bg-opacity-50" />
                    ) : null}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center px-2 sm:px-4">
          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md">
            <h2 className="text-xl sm:text-2xl font-serif text-[#4A4A4A] mb-4">New Task</h2>
            <input
              type="text"
              placeholder="Task name"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full mb-4 bg-[#FAFAF9] focus:outline-none text-sm sm:text-base"
            />
            <label className="block mb-2 text-xs sm:text-sm text-[#4A4A4A]">End time:</label>
            <select
              value={endSlot}
              onChange={(e) => setEndSlot(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 w-full mb-4 bg-[#FAFAF9] focus:outline-none text-sm sm:text-base"
            >
              {times.map((t, i) =>
                startSlot && i >= startSlot.slot ? (
                  <option key={i} value={i}>{t}</option>
                ) : null
              )}
            </select>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
              <Button
                className="w-full sm:w-auto bg-[#E07A5F] hover:bg-[#C9634C] text-white px-4 py-2 rounded-lg text-sm sm:text-base"
                onClick={() => {
                  setShowPopup(false);
                  setStartSlot(null);
                  setEndSlot(null);
                  setDragging(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto bg-[#A8B5A0] hover:bg-[#8E9E84] text-white px-4 py-2 rounded-lg text-sm sm:text-base"
                onClick={confirmReservation}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
