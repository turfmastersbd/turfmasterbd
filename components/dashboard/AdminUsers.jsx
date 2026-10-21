"use client";
import { useEffect, useState, useMemo } from "react";
import Loading from "../shared/Loading";
import EmptyState from "../shared/Empty";


const ALLOWED_ROLES = [
  "REGULAR_CUSTOMER",
  "SPECIAL_CUSTOMER",
  "GENERAL_ADMIN",
  "MANAGER",
  "VIEWER",
];

export default function AdminUsers() {
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteUserName, setDeleteUserName] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingRole, setPendingRole] = useState(null);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phoneSearch, setPhoneSearch] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/all-users");
      const data = await res.json();

      
      const filtered = data.filter(u => u.role !== "SUPER_ADMIN");

      console.log("ALL USERS API DATA:", data);

      setUsers(filtered);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!phoneSearch.trim()) return users;
    const searchRaw = phoneSearch.trim().toLowerCase();
    const searchDigits = searchRaw.replace(/\D/g, "");

    return users.filter((user) => {
      const phone = (user.phone || "").toString().toLowerCase();
      const phoneDigits = phone.replace(/\D/g, "");
      return (
        phone.includes(searchRaw) ||
        (searchDigits && phoneDigits.includes(searchDigits))
      );
    });
  }, [users, phoneSearch]);

  // const updateRole = async (id, role) => {
  //   await fetch(`/api/all-users/${id}`, {
  //     method: "PATCH",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ role }),
  //   });

  //   fetchUsers();
  // };

  const confirmUpdateRole = async () => {
    try {
      await fetch(`/api/all-users/${pendingUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: pendingRole }),
      });

      setConfirmOpen(false);
      setPendingUserId(null);
      setPendingRole(null);

      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async () => {
    try {
      const res = await fetch(`/api/all-users/${deleteUserId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete user");
        return;
      }

      setDeleteUserId(null);
      setDeleteUserName("");

      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  if (loading) return <Loading />;
  if (!users.length) return <EmptyState message="No users found" />;

  return (
    <div className="dashboard__booking">
      <p className="dashboard__booking-title">Users</p>

      <div className="dashboard__filter-wrap">
        <div className="dashboard__filter">
          <label>Filter by phone:</label>
          <input
            type="text"
            placeholder="Search phone number..."
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
          />
        </div>

        {phoneSearch && (
          <div className="dashboard__filter">
            <button
              className="tertiary-button"
              onClick={() => setPhoneSearch("")}
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      <div className="dashboard__booking-scroll">
        <table className="transactions-table dashboard__booking-list">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Current Role</th>
              <th>Update Role</th>
              <th>Delete Users</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                  No users found matching &quot;{phoneSearch}&quot;
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.role}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => {
                        setPendingUserId(user._id);
                        setPendingRole(e.target.value);
                        setConfirmOpen(true);
                      }}
                    >
                      {ALLOWED_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="delete-button"
                      onClick={() => {
                        setDeleteUserId(user._id);
                        setDeleteUserName(user.name);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


      {confirmOpen && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3 className="delete-modal-heading">Confirm Role Update</h3>

            <p className="delete-modal-text">
              Are you sure you want to change this user role?
            </p>

            <div className="delete-modal-actions">
              <button
                className="secondary-button"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>

              <button
                className="edit-button confirm-delete-button"
                onClick={confirmUpdateRole}
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}


      {deleteUserId && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3 className="delete-modal-heading">Want to Delete this User?</h3>

            <p className="delete-modal-text">
              Are you sure you want to delete{" "}
              <strong className="delete-modal-text-name">{deleteUserName}</strong>?
            </p>

            <div className="delete-modal-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setDeleteUserId(null);
                  setDeleteUserName("");
                }}
              >
                Cancel
              </button>

              <button
                className="delete-button confirm-delete-button"
                onClick={deleteUser}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
