import subprocess
import os
import sys

VPS_IP = "34.88.91.159"
USER = "opencode"
KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519_gcp")

FILES_TO_SYNC = [
    "index.html",
    "admin.html",
    "styles.css",
    "admin.css",
    "app.js",
    "admin.js",
    "server.js",
    "package.json",
    "setup_server.sh",
    "DEPLOYMENT_INFO.md"
]

DIRS_TO_SYNC = [
    "assets",
    "data",
    "moodboard"
]

def run_ssh(cmd):
    full_cmd = [
        "ssh", "-i", KEY_PATH,
        "-o", "StrictHostKeyChecking=no",
        f"{USER}@{VPS_IP}",
        cmd
    ]
    return subprocess.run(full_cmd, capture_output=True, text=True)

def main():
    print(f"[*] Starting Deployment to Google Cloud VM: {VPS_IP}...")
    
    # 1. Test SSH
    test = run_ssh("echo OK")
    if "OK" not in test.stdout:
        print(f"[!] SSH Connection failed: {test.stderr}")
        sys.exit(1)
    print("[+] SSH Connection verified.")

    # 2. Ensure remote directory structure
    run_ssh("sudo mkdir -p /var/www/cherevichka/data /var/www/cherevichka/uploads /var/www/cherevichka/assets /var/www/cherevichka/moodboard && sudo chown -R $USER:$USER /var/www/cherevichka")

    # 3. Copy files via scp
    print("[*] Uploading core files...")
    scp_files = FILES_TO_SYNC
    scp_cmd = [
        "scp", "-i", KEY_PATH,
        "-o", "StrictHostKeyChecking=no",
        "-r"
    ] + scp_files + DIRS_TO_SYNC + [f"{USER}@{VPS_IP}:/var/www/cherevichka/"]
    
    res = subprocess.run(scp_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[!] File upload warning/error: {res.stderr}")
    else:
        print("[+] Files uploaded successfully.")

    # 4. Run setup script on remote server
    print("[*] Provisioning and configuring Nginx & Systemd...")
    setup_res = run_ssh("chmod +x /var/www/cherevichka/setup_server.sh && /var/www/cherevichka/setup_server.sh")
    print(setup_res.stdout)
    if setup_res.returncode != 0:
        print(f"[!] Setup warning: {setup_res.stderr}")

    # 5. Check Service Status
    status_res = run_ssh("systemctl is-active cherevichka && systemctl is-active nginx")
    print(f"[+] Service status:\n{status_res.stdout}")
    print("[SUCCESS] Deployment Complete! Site is live on http://34.88.91.159")

if __name__ == "__main__":
    main()
