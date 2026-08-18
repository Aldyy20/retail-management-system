using Microsoft.AspNetCore.Identity;
using POS.DataLayer.Interfaces;

namespace POS.Server.Entities;

/// <summary>
/// Pengguna sistem untuk seluruh role: Admin, Owner, Supervisor, dan Karyawan.
/// Identity sudah menyediakan UserName, Email, PhoneNumber, dan PasswordHash.
/// </summary>
public class ApplicationUser : IdentityUser, ITableDataInfo, IActivatable
{
    public ApplicationUser()
    {
        Id = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class ApplicationRole : IdentityRole
{
    public ApplicationRole()
    {
    }

    public ApplicationRole(string roleName) : base(roleName)
    {
        Id = Guid.NewGuid().ToString();
        NormalizedName = roleName.ToUpperInvariant();
    }

    public string? Description { get; set; }
}
