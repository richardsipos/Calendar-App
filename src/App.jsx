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

// Softer natural palette for users
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
  const [dragging, setDragging] = useState(null);
  const [description, setDescription] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // Calculate current week's dates (Monday start)
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

  // 🔹 Sync users in real time
  useEffect(() => {
    const q = query(collection(db, "Users"));
    const unsub = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map((doc) => doc.data().name));
    });
    return () => unsub();
  }, []);

  // 🔹 Sync reservations in real time
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

  const deleteUser = async (name) => {
    // Remove from Users collection
    const userDoc = users.find((u) => u === name);
    if (userDoc) {
      // In production, query by name and delete
    }
    if (user === name) {
      setUser("");
      localStorage.removeItem("calendarUser");
    }
    // Reservations cleanup left as exercise (query + delete)
  };

  const getUserColor = (name) => {
    const idx = users.indexOf(name);
    return userColors[idx % userColors.length] || "#9CA3AF";
  };

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

  const handleMouseEnter = (day, slot) => {
    if (!dragging) return;
    if (dragging.day !== day) return;
    setDragging({ ...dragging, end: slot });
  };

  const handleMouseUp = () => {
    if (!dragging) return;
    setShowPopup(true);
  };

  const confirmReservation = async () => {
    if (!dragging) return;
    if (!user.trim() || !description.trim()) {
      setDragging(null);
      setShowPopup(false);
      return;
    }
    const { day, start, end } = dragging;
    const newRes = {
      day,
      start: Math.min(start, end),
      end: Math.max(start, end),
      user,
      description,
    };
    await addDoc(collection(db, "Reservations"), newRes);
    setDescription("");
    setDragging(null);
    setShowPopup(false);
  };

  const getReservationsForSlot = (day, slot) =>
    reservations.filter((r) => r.day === day && slot >= r.start && slot <= r.end);

  return (
    <div className="p-8 bg-[#FAFAF8] min-h-screen">
      <h1 className="text-4xl font-serif text-[#4A4A4A] mb-8 tracking-wide">
        📅 Shared Weekly Calendar (Online)
      </h1>

      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="border rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none"
        >
          <option value="">Select user</option>
          {users.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="New user"
          onChange={(e) => setUser(e.target.value)}
          className="border rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none"
        />
        <Button
          className="bg-[#A8B5A0] hover:bg-[#8E9E84] text-white px-4 py-2 rounded-lg shadow"
          onClick={saveUser}
        >
          Save User
        </Button>
      </div>

      {/* Calendar Grid */}
      <div
        className="grid grid-cols-8 border border-[#E0DED9] rounded-2xl shadow overflow-hidden select-none bg-white"
        onMouseUp={handleMouseUp}
      >
        <div className="bg-[#F5F3F0] p-2 text-center font-serif font-semibold text-[#4A4A4A]">
          Time
        </div>
        {days.map((day, i) => (
          <div key={day} className="bg-[#F5F3F0] p-2 text-center font-serif font-semibold text-[#4A4A4A]">
            <div>{day}</div>
            <div className="text-sm text-[#6B705C]">
              {weekDates[i].toLocaleString("default", { month: "short", day: "numeric" })}
            </div>
          </div>
        ))}
        {times.map((time, idx) => (
          <React.Fragment key={time}>
            <div className="border-t border-[#E0DED9] p-2 text-sm bg-[#FAFAF8] text-[#4A4A4A] font-light">
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
                  className={`border-t border-l border-[#E0DED9] h-12 cursor-pointer transition-colors duration-200 flex items-stretch justify-center text-sm rounded-sm ${
                    slotReservations.length > 0 || isDragging ? "text-white" : "hover:bg-[#E9ECE7]"
                  }`}
                  onMouseDown={() => handleMouseDown(day, idx)}
                  onMouseEnter={() => handleMouseEnter(day, idx)}
                >
                  {slotReservations.length > 0 ? (
                    slotReservations.map((r) => (
                      <div
                        key={r.id}
                        className="flex-1 flex items-center justify-center overflow-hidden"
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

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-serif text-[#4A4A4A] mb-4">Add Description</h2>
            <input
              type="text"
              placeholder="What are you doing?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full mb-4 bg-[#FAFAF9] focus:outline-none"
            />
            <div className="flex space-x-3 justify-end">
              <Button
                className="bg-[#E07A5F] hover:bg-[#C9634C] text-white px-4 py-2 rounded-lg"
                onClick={() => {
                  setShowPopup(false);
                  setDragging(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#A8B5A0] hover:bg-[#8E9E84] text-white px-4 py-2 rounded-lg"
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
