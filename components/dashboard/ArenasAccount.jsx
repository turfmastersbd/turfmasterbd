"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Loading from "../shared/Loading";
import EmptyState from "../shared/Empty";
import { Pencil, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";

export default function ArenasAccount() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Income Form State
  const [incomeForm, setIncomeForm] = useState({
    arena: "Royel Turf & Swimming Zone",
    type: "",
    customType: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: ""
  });

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    arena: "Royel Turf & Swimming Zone",
    type: "",
    salaryName: "",
    utilityType: "",
    customType: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: ""
  });

  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedDate) queryParams.append("date", selectedDate);
      if (selectedMonth) queryParams.append("month", selectedMonth);
      queryParams.append("arena", "Royel Turf & Swimming Zone");

      const qs = queryParams.toString();

      const [summaryRes, incomeRes, expenseRes, usersRes] = await Promise.all([
        fetch(`/api/arenas-account/summary?${qs}`),
        fetch(`/api/arenas-account/income?${qs}`),
        fetch(`/api/arenas-account/expense?${qs}`),
        fetch("/api/admin-users")
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (incomeRes.ok) setIncomes(await incomeRes.json());
      if (expenseRes.ok) setExpenses(await expenseRes.json());
      if (usersRes.ok) {
        const userData = await usersRes.json();
        setAdminUsers(userData.users || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedMonth]);

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    try {
      const payload = {
        arena: incomeForm.arena,
        type: incomeForm.type,
        amount: Number(incomeForm.amount),
        date: incomeForm.date,
        note: incomeForm.note
      };

      if (incomeForm.type === "Others") {
        payload.customType = incomeForm.customType;
      }

      const method = editingIncomeId ? "PUT" : "POST";
      const body = editingIncomeId ? { ...payload, id: editingIncomeId } : payload;

      const res = await fetch("/api/arenas-account/income", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast.success(editingIncomeId ? "Income updated" : "Income added");
        setIncomeForm({
          arena: "Royel Turf & Swimming Zone",
          type: "",
          customType: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          note: ""
        });
        setEditingIncomeId(null);
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Operation failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    try {
      const payload = {
        arena: expenseForm.arena,
        type: expenseForm.type,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        description: expenseForm.description
      };

      if (expenseForm.type === "Salary") payload.salaryName = expenseForm.salaryName;
      if (expenseForm.type === "Utility Bill") payload.utilityType = expenseForm.utilityType;
      if (expenseForm.type === "Others") payload.customType = expenseForm.customType;

      const method = editingExpenseId ? "PUT" : "POST";
      const body = editingExpenseId ? { ...payload, id: editingExpenseId } : payload;

      const res = await fetch("/api/arenas-account/expense", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast.success(editingExpenseId ? "Expense updated" : "Expense added");
        setExpenseForm({
          arena: "Royel Turf & Swimming Zone",
          type: "",
          salaryName: "",
          utilityType: "",
          customType: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          description: ""
        });
        setEditingExpenseId(null);
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Operation failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const deleteIncome = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/arenas-account/income?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          Swal.fire("Deleted!", "Income record has been deleted.", "success");
          fetchData();
        }
      } catch (err) {
        toast.error("Failed to delete");
      }
    }
  };

  const deleteExpense = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/arenas-account/expense?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          Swal.fire("Deleted!", "Expense record has been deleted.", "success");
          fetchData();
        }
      } catch (err) {
        toast.error("Failed to delete");
      }
    }
  };

  const skyTurfIncomes = incomes.filter(inc => inc.arena === "Royel Turf & Swimming Zone");
  const skyTurfExpenses = expenses.filter(exp => exp.arena === "Royel Turf & Swimming Zone");
  const skyTurfSummary = summary?.summary?.find(s => s.arena === "Royel Turf & Swimming Zone") || { income: 0, expense: 0, balance: 0 };

  if (loading && !summary) return <Loading />;

  return (
    <div className="arenas-account">
      <h2 className="dashboard__title">Arenas Account</h2>

      {/* Filters */}
      <div className="dashboard__filter-wrap">
        <div className="dashboard__filter">
          <label>Filter by month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedDate("");
            }}
            onClick={(e) => {
              try {
                e.target.showPicker();
              } catch (err) {}
            }}
          />
        </div>
        <div className="dashboard__filter">
          <label>Filter by date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedMonth("");
            }}
            onClick={(e) => {
              try {
                e.target.showPicker();
              } catch (err) {}
            }}
          />
        </div>
        {(selectedDate || selectedMonth) && (
          <div className="dashboard__filter">
            <button
              className="tertiary-button"
              onClick={() => {
                setSelectedDate("");
                setSelectedMonth("");
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="account-summary grid-3">
        <div className="summary-card summary-card--secondary income">
          <h3>Total Monthly Income</h3>
          <p className="amount">৳{skyTurfSummary.income || 0}</p>
        </div>
        <div className="summary-card summary-card--secondary expense">
          <h3>Total Monthly Expense</h3>
          <p className="amount">৳{skyTurfSummary.expense || 0}</p>
        </div>
        <div className="summary-card summary-card--secondary balance">
          <h3>Total Balance / Remaining Amount</h3>
          <p className="amount">৳{skyTurfSummary.balance || 0}</p>
        </div>
      </div>

      <div className="arena-details-grid" id="arenas-summary-section">
        {summary?.summary.filter(s => s.arena === "Royel Turf & Swimming Zone").map((s) => (
          <div key={s.arena} className="arena-summary-card">
            <h4>{s.arena}</h4>
            <div className="summary-row">
              <span>Monthly Income:</span>
              <span className="text-income">৳{s.income}</span>
            </div>
            <div className="summary-row">
              <span>Monthly Expense:</span>
              <span className="text-expense">৳{s.expense}</span>
            </div>
            <div className="summary-row border-top">
              <span>Balance:</span>
              <span className="text-balance font-bold">৳{s.balance}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="account-sections grid-2 mt-4">
        {/* Income Section */}
        <div className="account-section-card">
          <div className="section-header flex-between">
            <h3>Income Section</h3>
            {editingIncomeId && (
              <button
                className="text-button flex align-center"
                onClick={() => {
                  setEditingIncomeId(null);
                  setIncomeForm({
                    arena: "Royel Turf & Swimming Zone",
                    type: "",
                    customType: "",
                    amount: "",
                    date: new Date().toISOString().split("T")[0],
                    note: ""
                  });
                }}
              >
                <X size={16} /> Cancel Edit
              </button>
            )}
          </div>

          {isSuperAdmin && (
            <form onSubmit={handleIncomeSubmit} className="account-form">
              <div className="form-grid">

                <div className="form-group">
                  <label>Income Type</label>
                  <select
                    required
                    value={incomeForm.type}
                    onChange={(e) => setIncomeForm({ ...incomeForm, type: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="Slot Booking">Slot Booking</option>
                    <option value="Item Sell">Item Sell</option>
                    <option value="Cash from Other Admins">Cash from Other Admins</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                {incomeForm.type === "Others" && (
                  <div className="form-group">
                    <label>Custom Type</label>
                    <input
                      type="text"
                      required
                      placeholder="Specify type"
                      value={incomeForm.customType}
                      onChange={(e) => setIncomeForm({ ...incomeForm, customType: e.target.value })}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="Amount"
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  />
                </div>
                <div className={`form-group ${incomeForm.type !== "Others" ? "full-width" : ""}`}>
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Note (optional)</label>
                  <textarea
                    placeholder="Note"
                    value={incomeForm.note}
                    onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <button type="submit" className="tertiary-button mt-2">
                {editingIncomeId ? "Update Income" : "Add Income"}
              </button>
            </form>
          )}

          <div className="table-container mt-4">
            {/* Royel Turf & Swimming Zone Incomes */}
            <div className="table-responsive">
              <h3 className="section-subtitle">Royel Turf & Swimming Zone Incomes</h3>
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skyTurfIncomes.length === 0 ? (
                    <tr><td colSpan="5" className="text-center">No Royel Turf & Swimming Zone records</td></tr>
                  ) : (
                    skyTurfIncomes.map((inc) => (
                      <tr key={inc._id}>
                        <td>{new Date(inc.date).toLocaleDateString()} ({new Date(inc.date).toLocaleDateString('en-US', { weekday: 'short' })})</td>
                        <td>{inc.type === "Others" ? inc.customType : inc.type}</td>
                        <td className="text-income">৳{inc.amount}</td>
                        <td>{inc.note || "-"}</td>
                        {isSuperAdmin && (
                          <td className="action-cell">
                            <div className="action-flex">
                              <button
                                className="icon-button edit"
                                onClick={() => {
                                  setEditingIncomeId(inc._id);
                                  setIncomeForm({
                                    arena: inc.arena,
                                    type: inc.type,
                                    customType: inc.customType || "",
                                    amount: inc.amount,
                                    date: new Date(inc.date).toISOString().split("T")[0],
                                    note: inc.note || ""
                                  });
                                  document.getElementById("arenas-summary-section")?.scrollIntoView({ behavior: "smooth" });
                                }}
                              >
                                <Pencil size={16} />
                              </button>
                              <button className="icon-button delete" onClick={() => deleteIncome(inc._id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>


          </div>
        </div>

        {/* Expense Section */}
        <div className="account-section-card">
          <div className="section-header flex-between">
            <h3>Expense Section</h3>
            {editingExpenseId && (
              <button
                className="text-button flex align-center"
                onClick={() => {
                  setEditingExpenseId(null);
                  setExpenseForm({
                    arena: "Royel Turf & Swimming Zone",
                    type: "",
                    salaryName: "",
                    utilityType: "",
                    customType: "",
                    amount: "",
                    date: new Date().toISOString().split("T")[0],
                    description: ""
                  });
                }}
              >
                <X size={16} /> Cancel Edit
              </button>
            )}
          </div>

          {isSuperAdmin && (
            <form onSubmit={handleExpenseSubmit} className="account-form">
              <div className="form-grid">

                <div className="form-group">
                  <label>Expense Type</label>
                  <select
                    required
                    value={expenseForm.type}
                    onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="Salary">Salary</option>
                    <option value="Utility Bill">Utility Bill</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                {expenseForm.type === "Salary" && (
                  <div className="form-group">
                    <label>Staff Name</label>
                    <select
                      required
                      value={expenseForm.salaryName}
                      onChange={(e) => setExpenseForm({ ...expenseForm, salaryName: e.target.value })}
                    >
                      <option value="">Select Name</option>
                      {adminUsers
                        .filter(u => ["GENERAL_ADMIN", "MANAGER", "VIEWER"].includes(u.role))
                        .map(user => (
                          <option key={user._id} value={user.name}>{user.name} ({user.role})</option>
                        ))}
                    </select>
                  </div>
                )}
                {expenseForm.type === "Utility Bill" && (
                  <div className="form-group">
                    <label>Utility Type</label>
                    <select
                      required
                      value={expenseForm.utilityType}
                      onChange={(e) => setExpenseForm({ ...expenseForm, utilityType: e.target.value })}
                    >
                      <option value="">Select Utility</option>
                      <option value="Electricity Bill">Electricity Bill</option>
                      <option value="Gas Bill">Gas Bill</option>
                      <option value="Service Charge">Service Charge</option>
                      <option value="Water Bill">Water Bill</option>
                    </select>
                  </div>
                )}
                {expenseForm.type === "Others" && (
                  <div className="form-group">
                    <label>Custom Type</label>
                    <input
                      type="text"
                      required
                      placeholder="Specify type"
                      value={expenseForm.customType}
                      onChange={(e) => setExpenseForm({ ...expenseForm, customType: e.target.value })}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="Amount"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
                <div className={`form-group ${!["Salary", "Utility Bill", "Others"].includes(expenseForm.type) ? "full-width" : ""}`}>
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description / Note</label>
                  <textarea
                    placeholder="Description"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <button type="submit" className="tertiary-button mt-2">
                {editingExpenseId ? "Update Expense" : "Add Expense"}
              </button>
            </form>
          )}

          <div className="table-container mt-4">
            {/* Royel Turf & Swimming Zone Expenses */}
            <div className="table-responsive">
              <h3 className="section-subtitle">Royel Turf & Swimming Zone Expenses</h3>
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skyTurfExpenses.length === 0 ? (
                    <tr><td colSpan="6" className="text-center">No Royel Turf & Swimming Zone records</td></tr>
                  ) : (
                    skyTurfExpenses.map((exp) => (
                      <tr key={exp._id}>
                        <td>{new Date(exp.date).toLocaleDateString()} ({new Date(exp.date).toLocaleDateString('en-US', { weekday: 'short' })})</td>
                        <td>
                          {exp.type === "Salary" ? `Salary: ${exp.salaryName}` :
                            exp.type === "Utility Bill" ? exp.utilityType :
                              exp.customType || exp.type}
                        </td>
                        <td className="text-expense">৳{exp.amount}</td>
                        <td>{exp.description || "-"}</td>
                        {isSuperAdmin && (
                          <td className="action-cell">
                            <div className="action-flex">
                              <button
                                className="icon-button edit"
                                onClick={() => {
                                  setEditingExpenseId(exp._id);
                                  setExpenseForm({
                                    arena: exp.arena,
                                    type: exp.type,
                                    salaryName: exp.salaryName || "",
                                    utilityType: exp.utilityType || "",
                                    customType: exp.customType || "",
                                    amount: exp.amount,
                                    date: new Date(exp.date).toISOString().split("T")[0],
                                    description: exp.description || ""
                                  });
                                  document.getElementById("arenas-summary-section")?.scrollIntoView({ behavior: "smooth" });
                                }}
                              >
                                <Pencil size={16} />
                              </button>
                              <button className="icon-button delete" onClick={() => deleteExpense(exp._id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>


          </div>
        </div>
      </div>


    </div>
  );
}
