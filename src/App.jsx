import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./components/Card.jsx";
import { Button } from "./components/Button.jsx";

const times = Array.from({ length: 32 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Softer natural palette for users
const userColors = [
  "#B5A896", // beige
  "#A8B5A0", // sage/olive
  "#E07A5F", // terracotta accent
  "#D8B4A0", // dusty rose
  "#6B705C", // muted olive
  "#CB997E", // warm taupe
  "#C08497", // blush pink
];

export default function CalendarApp() {
  const [user, setUser] = useState(localStorage.getItem("calendarUser") || "");
  const [users, setUsers] = useState(
    JSON.parse(localStorage.getItem("calendarUsers") || "[]")
  );
  const [reservations, setReservations] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [description, setDescription] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // Calculate current week's dates (Monday start)
  const today = new Date();
  const startOfWeek = new Date(today);
  const jsDay = today.getDay(); // 0 Sun - 6 Sat
  // convert to Monday-start: subtract (jsDay === 0 ? 6 : jsDay - 1)
  const offsetToMonday = jsDay === 0 ? 6 : jsDay - 1;
  startOfWeek.setHours(0,0,0,0);
  startOfWeek.setDate(today.getDate() - offsetToMonday);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  useEffect(() => {
    if (user && !users.includes(user)) {
      const newUsers = [...users, user];
      setUsers(newUsers);
      localStorage.setItem("calendarUsers", JSON.stringify(newUsers));
    }
  }, [user]);

  const saveUser = () => {
    if (user.trim()) {
      localStorage.setItem("calendarUser", user);
      if (!users.includes(user)) {
        const newUsers = [...users, user];
        setUsers(newUsers);
        localStorage.setItem("calendarUsers", JSON.stringify(newUsers));
      }
    }
  };

  const deleteUser = (name) => {
    const updatedUsers = users.filter((u) => u !== name);
    setUsers(updatedUsers);
    localStorage.setItem("calendarUsers", JSON.stringify(updatedUsers));
    if (user === name) {
      setUser("");
      localStorage.removeItem("calendarUser");
    }
    // Remove reservations from deleted user
    setReservations(reservations.filter((r) => r.user !== name));
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
      setReservations(reservations.filter((r) => r !== mine));
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

  const confirmReservation = () => {
    if (!dragging) return;
    if (!user.trim() || !description.trim()) {
      setDragging(null);
      setShowPopup(false);
      return;
    }
    const { day, start, end } = dragging;
    const newRes = {
      id: Date.now(),
      day,
      start: Math.min(start, end),
      end: Math.max(start, end),
      user,
      description,
    };
    setReservations([...reservations, newRes]);
    setDescription("");
    setDragging(null);
    setShowPopup(false);
  };

  // Return all reservations for a given day/slot
  const getReservationsForSlot = (day, slot) =>
    reservations.filter((r) => r.day === day && slot >= r.start && slot <= r.end);

  return (
    <div className="p-8 bg-[#FAFAF8] min-h-screen">
      <h1 className="text-4xl font-serif text-[#4A4A4A] mb-8 tracking-wide">
        📅 Shared Weekly Calendar
      </h1>

      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="border rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none"
        >
          <option value="">Select or create user</option>
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
        <Button className="bg-[#A8B5A0] hover:bg-[#8E9E84] text-white px-4 py-2 rounded-lg shadow" onClick={saveUser}>
          Save User
        </Button>
      </div>

      {users.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="font-serif text-lg text-[#4A4A4A]">Manage Users</h3>
          <ul className="space-y-1">
            {users.map((u) => (
              <li key={u} className="flex items-center justify-between bg-[#F5F3F0] px-3 py-1 rounded">
                <span>{u}</span>
                <Button
                  className="bg-[#E07A5F] hover:bg-[#C9634C] text-white px-2 py-1 rounded"
                  onClick={() => deleteUser(u)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {user && (
        <p className="mb-6 text-[#4A4A4A]">
          Logged in as <b>{user}</b>
        </p>
      )}

      <div
        className="grid grid-cols-8 border border-[#E0DED9] rounded-2xl shadow overflow-hidden select-none bg-white"
        onMouseUp={handleMouseUp}
      >
        <div className="bg-[#F5F3F0] p-2 text-center font-serif font-semibold text-[#4A4A4A]">
          Time
        </div>
        {days.map((day, i) => (
          <div
            key={day}
            className="bg-[#F5F3F0] p-2 text-center font-serif font-semibold text-[#4A4A4A]"
          >
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
                    slotReservations.map((r, i) => (
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

      <Card className="mt-10 bg-white shadow-lg rounded-2xl">
        <CardContent>
          <h2 className="text-2xl font-serif text-[#4A4A4A] mb-3">Features</h2>
          <ul className="list-disc list-inside space-y-1 text-[#4A4A4A]">
            <li>Saved users shown in dropdown 👥</li>
            <li>Each user has their own natural color 🎨</li>
            <li>First cell shows username, following cells show task 📝</li>
            <li>Drag to mark busy, click again to remove 🔄</li>
            <li>Half-hour slots from 6:00 to 22:00 ⏰</li>
            <li>If multiple users overlap, cell is divided equally ⚖️</li>
            <li>Delete users and their reservations ❌</li>
            <li>Shows current week dates under weekdays 📆</li>
          </ul>
          <Button className="mt-6 bg-[#A8B5A0] hover:bg-[#8E9E84] text-white px-6 py-2 rounded-lg">
            Share Calendar Link
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
