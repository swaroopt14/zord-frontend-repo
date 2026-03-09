# EC2 + Minikube + Argo CD Deployment Guide

This guide follows your plan exactly:
1. Launch EC2
2. Install tools
3. Install Minikube
4. Install Argo CD
5. Open Argo CD UI
6. Deploy your Zord app

## 1) Launch EC2

Use:
- OS: Amazon Linux 2023
- Instance: `t3.large` (recommended). `t3.medium` is usually low for full stack.
- Storage: 30 GB+
- Security Group inbound:
- `22` (SSH) from your IP
- `3000` (optional app direct access)
- `8080` (optional app direct access)

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
minikube start --driver=docker --cpus=3 --memory=6144
kubectl get nodes
```

Enable ingress addon:

```bash
minikube addons enable ingress
```

## 5) Install Argo CD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl get pods -n argocd
```

Wait until all Argo CD pods are `Running`.

## 6) Open Argo CD UI

Port-forward on EC2:

```bash
kubectl port-forward svc/argocd-server -n argocd 8081:443 --address 127.0.0.1
```

From your laptop, create SSH tunnel:

```bash
ssh -i <your-key>.pem -L 8081:127.0.0.1:8081 ec2-user@<EC2_PUBLIC_IP>
```

Open in browser:
- `https://localhost:8081`

Get Argo CD admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

Login:
- Username: `admin`
- Password: (output above)

## 7) Clone Repo on EC2

```bash
git clone https://github.com/Arealis-network/Arealis-Zord.git
cd Arealis-Zord
git checkout prod
```

## 8) Apply Kubernetes Secrets (Required Before App)

Edit files first:
- `k8s-file/kubernetes/secrets/zord-secrets.yaml`
- `k8s-file/kubernetes/secrets/edge-signing-key.yaml`

Then apply:

```bash
kubectl apply -f k8s-file/kubernetes/secrets/zord-secrets.yaml
kubectl apply -f k8s-file/kubernetes/secrets/edge-signing-key.yaml
```

## 9) Deploy with Argo CD Application

Apply Argo application:

```bash
kubectl apply -n argocd -f k8s-file/argocd/arealis-zord-application.yaml
```

Check app sync:

```bash
kubectl get applications -n argocd
kubectl get pods -n arealis-zord
kubectl get svc -n arealis-zord
```

## 10) If You Want Manual kubectl Deployment (without Argo)

```bash
kubectl apply -f k8s-file/kubernetes/secrets/
kubectl apply -f k8s-file/kubernetes/services/
kubectl apply -f k8s-file/kubernetes/microservices/
```

## 11) Troubleshooting

Pods not starting:

```bash
kubectl get pods -n arealis-zord
kubectl describe pod <pod-name> -n arealis-zord
kubectl logs <pod-name> -n arealis-zord --tail=200
```

Argo app not syncing:

```bash
kubectl describe application arealis-zord -n argocd
```

Minikube low resources:
- Stop and restart with more memory/cpu:

```bash
minikube stop
minikube start --driver=docker --cpus=4 --memory=8192
```

