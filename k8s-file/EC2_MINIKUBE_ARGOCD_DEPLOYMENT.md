# EC2 + Minikube + Argo CD Deployment Guide

This guide is updated for the current `k8s-file/` structure (infra + microservices + observability + dashboards + ingress).

## 1) Launch EC2

Use:
- OS: Amazon Linux 2023
- Instance: `t3.large` (recommended)
- Storage: 30 GB+

Security Group inbound:
- `22` (SSH) from your IP
- `80` (optional frontend direct access)
- `8080` (optional edge API direct access)

SSH:

```bash
ssh -i <your-key>.pem ec2-user@<EC2_PUBLIC_IP>
```

## 2) Install Base Tools

```bash
sudo dnf update -y
sudo dnf install -y git curl wget tar conntrack socat
```

Install Docker:

```bash
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
newgrp docker
docker --version
```

## 3) Install kubectl

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
kubectl version --client
```

## 4) Install Minikube

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
minikube version
```

Start Minikube:

```bash
minikube start --driver=docker --cpus=4 --memory=8192
kubectl get nodes
```

Enable ingress:

```bash
minikube addons enable ingress
```

If using `LoadBalancer` services, run in separate session:

```bash
minikube tunnel
```

## 5) Install Argo CD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl get pods -n argocd
```

Wait until all Argo CD pods are `Running`.

## 6) Open Argo CD UI

On EC2:

```bash
kubectl port-forward svc/argocd-server -n argocd 8081:443 --address 127.0.0.1
```

From laptop:

```bash
ssh -i <your-key>.pem -L 8081:127.0.0.1:8081 ec2-user@<EC2_PUBLIC_IP>
```

Open:
- `https://localhost:8081`

Get password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

Login:
- Username: `admin`
- Password: above output

## 7) Clone Repo

```bash
git clone https://github.com/Arealis-network/Arealis-Zord.git
cd Arealis-Zord
git checkout prod
```

## 8) Configure Secrets

Edit:
- `k8s-file/kubernetes/secrets/zord-secrets.yaml`
- `k8s-file/kubernetes/secrets/edge-signing-key.yaml`

Set real values for:
- DB passwords
- AWS keys
- Gemini keys
- `ZORD_VAULT_KEY` (base64 32-byte)
- `TOKEN_ENCLAVE_MASTER_KEY` (base64 32-byte)
- `ed25519_private.pem`

## 9) Deploy (Recommended: secrets local, not in Git)

Apply secrets manually:

```bash
kubectl apply -k k8s-file/kubernetes/secrets
kubectl get secret -n arealis-zord zord-secrets edge-signing-key
```

Then deploy platform via Argo CD:

```bash
kubectl apply -n argocd -f k8s-file/argocd/arealis-zord-application.yaml
kubectl get applications -n argocd
```

## 10) Deploy with Root App (Platform Only)

Use app-of-apps for platform resources:

```bash
kubectl apply -n argocd -f k8s-file/argocd/arealis-zord-root-application.yaml
kubectl get applications -n argocd
```

This creates:
- `arealis-zord` (platform)

Note:
- Secrets are applied manually in Step 9.
- Root app does not manage secrets.

## 11) Validate Deployment

```bash
kubectl get pods -n arealis-zord
kubectl get svc -n arealis-zord
kubectl get ingress -n arealis-zord
```

Frontend service is exposed on port `80`:
- `zord-console` Service: `80 -> 3000`

## 12) Access Endpoints

Use endpoint list file:
- `k8s-file/link.md`

Observability ingress hosts:
- `http://grafana.zord.local/`
- `http://prometheus.zord.local/`
- `http://jaeger.zord.local/`

For local laptop testing, add hosts entries and port-forward ingress controller as needed.

## 13) Troubleshooting

```bash
kubectl get pods -n arealis-zord
kubectl describe pod <pod-name> -n arealis-zord
kubectl logs <pod-name> -n arealis-zord --tail=200
```

Argo CD details:

```bash
kubectl describe application arealis-zord -n argocd
kubectl describe application arealis-zord-root -n argocd
```

If Minikube is resource constrained:

```bash
minikube stop
minikube start --driver=docker --cpus=4 --memory=8192
```
